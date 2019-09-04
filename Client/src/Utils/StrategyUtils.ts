import { StepTree, Step } from 'wdk-client/Utils/WdkUser';
import { AddType } from 'wdk-client/Views/Strategy/Types';

export const replaceStep = (
  stepTree: StepTree,
  oldStepId: number,
  newStepId: number
): StepTree => 
  stepTree.stepId === oldStepId
    ? {
        stepId: newStepId,
        primaryInput: stepTree.primaryInput,
        secondaryInput: stepTree.secondaryInput
      }
    : {
        stepId: stepTree.stepId,
        primaryInput: stepTree.primaryInput && replaceStep(stepTree.primaryInput, oldStepId, newStepId),
        secondaryInput: stepTree.secondaryInput && replaceStep(stepTree.secondaryInput, oldStepId, newStepId)
      };

export const addStep = (
  stepTree: StepTree,
  addType: AddType,
  newStepId: number,
  newStepSecondaryInput: StepTree | undefined
): StepTree => 
  addType.type === 'append'
    ? append(stepTree, addType.primaryInputStepId, newStepId, newStepSecondaryInput)
    : insertBefore(stepTree, addType.outputStepId, newStepId, newStepSecondaryInput);

type NodeMetadata =
  | { type: "not-in-tree" }
  | { type: "root"; node: StepTree }
  | { type: "primary-input"; node: StepTree; parentNode: StepTree }
  | { type: "secondary-input"; node: StepTree; parentNode: StepTree };

export const getNodeMetadata = (tree: StepTree, targetId: number) => {
  return findTarget(tree, undefined);

  function findTarget(node: StepTree, parentNode?: StepTree): NodeMetadata {
    if (node.stepId === targetId) {
      return !parentNode
        ? { type: "root", node }
        : parentNode.primaryInput && parentNode.primaryInput.stepId === targetId
        ? { type: "primary-input", node, parentNode }
        : { type: "secondary-input", node, parentNode };
    }

    return [node.primaryInput, node.secondaryInput].reduce(
      (memo, childNode) =>
        childNode === undefined || memo.type !== "not-in-tree"
          ? memo
          : findTarget(childNode, node),
      { type: "not-in-tree" } as NodeMetadata
    );
  }
};

const append = (
  oldStepTree: StepTree,
  primaryStepId: number,
  newStepId: number,
  newStepSecondaryInput: StepTree | undefined
): StepTree => {
  const newStepTree = copyStepTree(oldStepTree);
  const primaryInput = getNodeMetadata(newStepTree, primaryStepId);

  if (
    primaryInput.type === "not-in-tree" ||
    primaryInput.type === "primary-input"
  ) {
    // Trying to append to an absent node or a node which is not
    // the root of a strategy (main or nested)

    return newStepTree;
  } else if (primaryInput.type === "root") {
    // Appending to the root node of the "main" strategy

    return {
      stepId: newStepId,
      primaryInput: newStepTree,
      secondaryInput: newStepSecondaryInput
    };
  } else {
    // Appending to the root node of a nested strategy
    const newStepParentNode = primaryInput.parentNode;

    newStepParentNode.secondaryInput = {
      stepId: newStepId,
      primaryInput: primaryInput.node,
      secondaryInput: newStepSecondaryInput
    };

    return newStepTree;
  }
};

const insertBefore = (
  oldStepTree: StepTree,
  outputStepId: number,
  newStepId: number,
  newStepSecondaryInput: StepTree | undefined
): StepTree => {
  const newStepTree = copyStepTree(oldStepTree);
  const outputStep = getNodeMetadata(newStepTree, outputStepId);

  if (outputStep.type === "not-in-tree") {
    // Trying to insert before an absent node

    return newStepTree;
  } else if (outputStep.node.primaryInput) {
    // Inserting before (client-side) Step >= 2
    outputStep.node.primaryInput = {
      stepId: newStepId,
      primaryInput: outputStep.node.primaryInput,
      secondaryInput: newStepSecondaryInput
    };

    return newStepTree;
  } else if (outputStep.type === "primary-input") {
    // Inserting before (client-side) Step 1 in a strategy with more than one leaf
    outputStep.parentNode.primaryInput = {
      stepId: newStepId,
      primaryInput: newStepSecondaryInput,
      secondaryInput: outputStep.node
    };

    return newStepTree;
  } else if (outputStep.type === "root") {
    // Inserting before (client-side) Step 1 in a one-leaf "main" streategy

    return {
      stepId: newStepId,
      primaryInput: newStepSecondaryInput,
      secondaryInput: outputStep.node
    };
  } else {
    // Inserting before (client-side) Step 1 in a one-leaf nested strategy
    outputStep.parentNode.secondaryInput = {
      stepId: newStepId,
      primaryInput: newStepSecondaryInput,
      secondaryInput: outputStep.node
    };

    return newStepTree;
  }
};

export const getOutputStep = (stepTree: StepTree, addType: AddType) => {
  if (addType.type === 'append') {
    const primaryInputMetadata = getNodeMetadata(stepTree, addType.primaryInputStepId);

    return primaryInputMetadata.type === 'not-in-tree' || primaryInputMetadata.type === 'root'
      ? undefined
      : primaryInputMetadata.parentNode;
  } else {
    const outputMetadata = getNodeMetadata(stepTree, addType.outputStepId);

    return outputMetadata.type === 'not-in-tree' 
      ? undefined
      : outputMetadata.node;
  }  
};

const copyStepTree = (stepTree: StepTree): StepTree => ({
  stepId: stepTree.stepId,
  primaryInput: stepTree.primaryInput && copyStepTree(stepTree.primaryInput),
  secondaryInput: stepTree.secondaryInput && copyStepTree(stepTree.secondaryInput)
});

export const getPreviousStep = (stepTree: StepTree, addType: AddType) => {
  if (addType.type === 'append') {
    return findSubtree(
      stepTree,
      addType.primaryInputStepId
    );
  }

  const insertionPointSubtree = findSubtree(
    stepTree,
    addType.outputStepId
  );

  return insertionPointSubtree && insertionPointSubtree.primaryInput;  
}

export const findSubtree = (stepTree: StepTree | undefined, targetStepId: number): StepTree | undefined => 
  stepTree === undefined
    ? undefined
    : stepTree.stepId === targetStepId
    ? stepTree
    : findSubtree(stepTree.primaryInput, targetStepId) || findSubtree(stepTree.secondaryInput, targetStepId);

export const findPrimaryBranchHeight = (stepTree: StepTree): number => {
  return traversePrimaryBranch(stepTree, 0);

  function traversePrimaryBranch(stepTree: StepTree, height: number): number {
    if (stepTree.primaryInput === undefined) {
      return height;
    }

    return traversePrimaryBranch(stepTree.primaryInput, height + 1);
  }
};

export const findPrimaryBranchLeaf = (stepTree: StepTree): StepTree =>
  stepTree.primaryInput === undefined
    ? stepTree
    : findPrimaryBranchLeaf(stepTree.primaryInput);

/**
 * Creates a new step tree with the target step and affected steps removed from
 * the step tree.
 * 
 * Note that this function does not perform any validation on the resulting step
 * tree. It is expected that either: a) it has already been determined that the
 * removal of the target step is a valid operation, or b) that code downstream
 * of this function will handle invalid step trees.
 */
export const removeStep = (stepTree: StepTree, targetStepId: number): StepTree | undefined => {
  return _recurse(stepTree);

  function _recurse(stepTree: StepTree | undefined): StepTree | undefined {
    if (stepTree == null) return stepTree;

    // Remove a step from head position if a strategy (e.g., a root step)
    // Return its primary input
    if (
      stepTree.stepId === targetStepId ||
      (stepTree.secondaryInput && stepTree.secondaryInput.stepId === targetStepId)
    ) {
      return stepTree.primaryInput;
    }
    
    // Remove a step from non-head position of a strategy.
    // Replace the primary input for which it is the primary input with its primary input.
    if (
      stepTree.primaryInput != null &&
      (
        (stepTree.primaryInput.stepId === targetStepId) ||
        (stepTree.primaryInput.secondaryInput && stepTree.primaryInput.secondaryInput.stepId === targetStepId)
      )
    ) {

      return stepTree.primaryInput.primaryInput == null
        ? stepTree.secondaryInput
        : {
          ...stepTree,
          primaryInput: stepTree.primaryInput.primaryInput
        };
    }

    return {
      ...stepTree,
      primaryInput: _recurse(stepTree.primaryInput),
      secondaryInput: _recurse(stepTree.secondaryInput)
    }
  }
}

/**
 * Creates an iterable of step IDs in a step tree.
 */
export function getStepIds(stepTree: StepTree | undefined): Array<number> {
  return stepTree == null
    ? []
    : [
      stepTree.stepId,
      ...getStepIds(stepTree.primaryInput),
      ...getStepIds(stepTree.secondaryInput)
    ];
}