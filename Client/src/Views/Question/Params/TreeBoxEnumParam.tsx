import 'wdk-client/Views/Question/Params/TreeBoxParam.scss';

import { escapeRegExp, intersection } from 'lodash';
import React from 'react';

import CheckboxTree from 'wdk-client/Components/CheckboxTree/CheckboxTree';
import Icon from 'wdk-client/Components/Icon/IconAlt';
import { safeHtml } from 'wdk-client/Utils/ComponentUtils';
import { Seq } from 'wdk-client/Utils/IterableUtils';
import { filterNodes, getLeaves, isBranch } from 'wdk-client/Utils/TreeUtils';
import { Parameter, TreeBoxEnumParam, TreeBoxVocabNode } from 'wdk-client/Utils/WdkModel';

import SelectionInfo from 'wdk-client/Views/Question/Params/SelectionInfo';
import { Props, createParamModule } from 'wdk-client/Views/Question/Params/Utils';
import { isEnumParam } from 'wdk-client/Views/Question/Params/EnumParamUtils';
import { INIT_PARAM } from 'wdk-client/Actions/QuestionActions';
import {
  setExpandedList,
  setSearchTerm,
  SET_EXPANDED_LIST,
  SET_SEARCH_TERM
} from 'wdk-client/Actions/TreeBoxEnumParamActions';
import { Action } from 'wdk-client/Actions';

function isType(parameter: Parameter): parameter is TreeBoxEnumParam {
  return isEnumParam(parameter) && parameter.displayType === 'treeBox';
}

function isParamValueValid() {
  return true;
}

// Types
// -----


type TreeBoxProps = Props<TreeBoxEnumParam, State>;

export type State = {
  expandedList: string[];
  searchTerm: string;
}


// Utils
// -----

function searchPredicate(node: TreeBoxVocabNode, searchTerms: string[]) {
  return searchTerms
    .map(term => new RegExp(escapeRegExp(term), 'i'))
    .every(re => re.test(node.data.display));
}

function getNodeId(node: TreeBoxVocabNode) {
  return node.data.term;
}

function getNodeChildren(node: TreeBoxVocabNode) {
  return node.children;
}

function removeBranches(tree: TreeBoxVocabNode, items: string[]) {
  const leaves = getLeaves(tree, getNodeChildren);
  return intersection(leaves.map(getNodeId), items);
}

function deriveSelectedBranches(tree: TreeBoxVocabNode, items: string[]) {
  const itemSet = new Set(items);
  return filterNodes((node: TreeBoxVocabNode) => (
    isBranch(node, getNodeChildren) &&
    node.children.every(child => itemSet.has(child.data.term))
  ), tree)
    .map((node: TreeBoxVocabNode) => node.data.term);
}

function findBranchTermsUpToDepth(tree: TreeBoxVocabNode, depth: number): string[] {
  if (depth === 0) return [];
  return Seq.from(tree.children)
    .flatMap(node => [ node.data.term, ...findBranchTermsUpToDepth(node, depth - 1)])
    .toArray();
}

function deriveIndeterminateBranches(tree: TreeBoxVocabNode, items: string[]) {
  const itemSet = new Set(items);
  return filterNodes((node: TreeBoxVocabNode) => (
    isBranch(node, getNodeChildren) &&
    node.children.some(child => itemSet.has(child.data.term)) &&
    node.children.some(child => !itemSet.has(child.data.term))
  ), tree)
  .map((node: TreeBoxVocabNode) => node.data.term);
}


// Reducer
// -------

export function reduce(state: State = {} as State, action: Action): State {
  switch(action.type) {
    case INIT_PARAM:
      return {
        expandedList: findBranchTermsUpToDepth(
          (action.payload.parameter as TreeBoxEnumParam).vocabulary,
          (action.payload.parameter as TreeBoxEnumParam).depthExpanded
        ),
        searchTerm: ''
      };

    case SET_EXPANDED_LIST:
      return {
        ...state,
        expandedList: action.payload.expandedList
      };

    case SET_SEARCH_TERM:
      return {
        ...state,
        searchTerm: action.payload.searchTerm
      };

    default:
      return state;
  }
}

// View
// ----


export function TreeBoxEnumParamComponent(props: TreeBoxProps) {
  const tree = props.parameter.vocabulary;
  const selectedNodes = props.value.split(/\s*,\s*/);
  const selectedLeaves = removeBranches(tree, selectedNodes);
  const allCount = getLeaves(tree, getNodeChildren).length;
  const selectedCount = props.parameter.countOnlyLeaves
    ? selectedLeaves.length
    : selectedNodes.length;

  return (
    <div className="wdk-TreeBoxParam">
      <SelectionInfo parameter={props.parameter} selectedCount={selectedCount} allCount={allCount} alwaysShowCount />
      <CheckboxTree
        isSelectable={true}
        isMultiPick={props.parameter.multiPick}
        linksPosition={CheckboxTree.LinkPlacement.Bottom}
        showRoot={false}
        tree={tree}
        getNodeId={getNodeId}
        getNodeChildren={getNodeChildren}
        nodeComponent={VocabNodeRenderer}
        onExpansionChange={expandedList => props.dispatch(setExpandedList({ ...props.ctx, expandedList}))}
        expandedList={props.uiState.expandedList}
        selectedList={selectedLeaves}
        onSelectionChange={(ids: string[]) => {
          const idsWithBranches = ids.concat(deriveSelectedBranches(tree, ids));
          props.onParamValueChange(idsWithBranches.join(','));
        }}
        isSearchable={true}
        searchBoxPlaceholder="Filter list below..."
        searchIconName="filter"
        noResultsComponent={NoResults}
        searchTerm={props.uiState.searchTerm}
        searchPredicate={searchPredicate}
        onSearchTermChange={searchTerm => props.dispatch(setSearchTerm({ ...props.ctx, searchTerm }))}
      />
    </div>
  );
}

type VocabNodeRendererProps = {
  node: TreeBoxVocabNode;
}

function VocabNodeRenderer(props: VocabNodeRendererProps) {
  return safeHtml(props.node.data.display);
}

type NoResultsProps = {
  searchTerm: string;
}

function NoResults(props: NoResultsProps) {
  return (
    <div style={{ padding: '1em' }}>
      <Icon fa="warning"/> The string <strong>{props.searchTerm}</strong> did not match anything for this parameter.
    </div>
  )
}

export default createParamModule({
  isType,
  isParamValueValid,
  reduce,
  Component: TreeBoxEnumParamComponent
});
