import { negate } from 'lodash';
import React, { ComponentClass, StatelessComponent } from 'react';
import { wrappable } from 'wdk-client/Utils/ComponentUtils';
import {
  getNodeId,
  getChildren as getNodeChildren,
  isIndividual,
  nodeSearchPredicate,
  BasicNodeComponent,
  CategoryTreeNode
} from 'wdk-client/Utils/CategoryUtils';
import CheckboxTree from 'wdk-client/Components/CheckboxTree/CheckboxTree';

// This allows us to specify the generic type in CheckboxTree
class RefinedCheckboxTree extends CheckboxTree<CategoryTreeNode> {}

type ChangeHandler = (ids: string[]) => void;

type NodePredicate = (node: CategoryTreeNode) => boolean;

type Props = {
  title: string;
  name?: string;
  /** Hide nodes for which predicate function returns false */
  visibilityFilter?: NodePredicate;
  autoFocusSearchBox?: boolean;
  searchBoxPlaceholder: string;
  tree: CategoryTreeNode;
  /** String name representing what is being searched */
  leafType: string, // do not make optional- add this prop to your calling code!
  selectedLeaves: string[];
  expandedBranches: string[];
  searchTerm: string;
  renderNode?: (node: CategoryTreeNode, path?: number[]) => React.ReactNode;
  isMultiPick?: boolean;
  onChange: ChangeHandler;
  onUiChange: ChangeHandler;
  onSearchTermChange: (term: string) => void;
  renderNoResults?: (searchTerm: string, tree: CategoryTreeNode) => React.ReactNode;
  isSelectable?: boolean;
  disableHelp?: boolean;
};

let CategoriesCheckboxTree: StatelessComponent<Props> = props => {

let {
  autoFocusSearchBox,
  disableHelp,
  expandedBranches,
  visibilityFilter,
  isMultiPick,
  isSelectable,
  leafType,
  name,
  onChange,
  onSearchTermChange,
  onUiChange,
  renderNoResults,
  renderNode,
  searchBoxPlaceholder,
  searchTerm,
  selectedLeaves,
  title,
  tree,
} = props;

  if (tree.children.length == 0) {
    return ( <noscript/> );
  }

  // set help
  let searchBoxHelp = disableHelp ? '' : 
    `Each ${leafType} name will be searched. The ${leafType} names will contain all your terms. Your terms are partially matched; for example, the term typ will match typically, type, atypical.`;

  return (
    <div className="wdk-CategoriesCheckboxTree">
      {title && <h3 className="wdk-CategoriesCheckboxTreeHeading">{title}</h3>}
      <div className="wdk-CategoriesCheckboxTreeWrapper">
        <RefinedCheckboxTree
          searchBoxHelp={searchBoxHelp}
          isSearchable={true}
          isSelectable={isSelectable}
          autoFocusSearchBox={autoFocusSearchBox}
          name={name}
          renderNoResults={renderNoResults}
          searchIconName="filter"
          linkPlacement={CheckboxTree.LinkPlacement.Top}
          getNodeId={getNodeId}
          getNodeChildren={visibilityFilter ? getFilteredNodeChildren(visibilityFilter) : getNodeChildren}
          searchPredicate={visibilityFilter ? nodeSearchPredicateWithHiddenNodes(visibilityFilter) : nodeSearchPredicate}
          renderNode={renderNode}
          tree={tree}
          isMultiPick={isMultiPick}
          selectedList={selectedLeaves}
          expandedList={expandedBranches}
          searchBoxPlaceholder={searchBoxPlaceholder}
          searchTerm={searchTerm}
          onSelectionChange={onChange}
          onExpansionChange={onUiChange}
          onSearchTermChange={onSearchTermChange}
        /> 
      </div>
    </div>
  );
};

CategoriesCheckboxTree.defaultProps = {
  renderNode: (node: CategoryTreeNode) => <BasicNodeComponent node={node} />,
  isMultiPick: true,
  isSelectable: true,
  leafType: 'column', // TODO remove once all consumers are passing in a value for this
  disableHelp: false
} as Props

export default wrappable(CategoriesCheckboxTree);

function getNodeChildrenWithHiddenIndividuals(node: CategoryTreeNode) {
  return getNodeChildren(node).filter(negate(isIndividual));
}

function nodeSearchPredicateWithHiddenIndividuals(node: CategoryTreeNode, searchQueryTerms: string[]) {
  return (
    nodeSearchPredicate(node, searchQueryTerms) ||
    getNodeChildren(node)
      .filter(isIndividual)
      .some(node => nodeSearchPredicate(node, searchQueryTerms))
  );
}

function getFilteredNodeChildren(visibilityFilter: NodePredicate) {
  return function (node: CategoryTreeNode) {
    return getNodeChildren(node).filter(visibilityFilter);
  }
}

function nodeSearchPredicateWithHiddenNodes(visibilityFilter: NodePredicate) {
  return function (node: CategoryTreeNode, searchQueryTerms: string[]) {
    return (
      nodeSearchPredicate(node, searchQueryTerms) ||
      getNodeChildren(node)
        .filter(negate(visibilityFilter))
        .some(node => nodeSearchPredicate(node, searchQueryTerms))
    );
  }
}
