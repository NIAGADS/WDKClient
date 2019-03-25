import * as React from 'react';
import { Answer, RecordClass, Question } from 'wdk-client/Utils/WdkModel';
import { CategoryTreeNode } from 'wdk-client/Utils/CategoryUtils';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';
import ResultTable from 'wdk-client/Views/ResultTableSummaryView/ResultTable';
import {
  Action,
  BasketStatusArray,
  RequestSortingUpdate,
  RequestColumnsChoiceUpdate,
  RequestUpdateBasket,
  RequestAddStepToBasket,
  RequestPageSizeUpdate,
  ViewPageNumber,
  ShowHideAddColumnsDialog,
  UpdateColumnsDialogExpandedNodes,
  UpdateColumnsDialogSelection,
  OpenAttributeAnalysis,
  CloseAttributeAnalysis,
  UpdateSelectedIds
} from 'wdk-client/Views/ResultTableSummaryView/Types';
import ResultTableAddColumnsDialog from 'wdk-client/Views/ResultTableSummaryView/ResultTableAddColumnsDialog';
import Loading from 'wdk-client/Components/Loading/Loading';

import './ResultTableSummaryView.scss';

// Export this for convenience
export { Action };

interface Props {
  answer?: Answer;
  answerLoading: boolean;
  addingStepToBasket: boolean;
  actions?: Action[];
  selectedIds?: string[];
  activeAttributeAnalysisName: string | undefined;
  stepId: number;
  recordClass?: RecordClass;
  question?: Question;
  basketStatusArray?: BasketStatusArray;
  columnsDialogIsOpen: boolean;
  columnsDialogSelection?: string[];
  columnsDialogExpandedNodes?: string[];
  columnsTree?: CategoryTreeNode;
  requestSortingUpdate: RequestSortingUpdate;
  requestColumnsChoiceUpdate: RequestColumnsChoiceUpdate;
  requestUpdateBasket: RequestUpdateBasket;
  requestAddStepToBasket: RequestAddStepToBasket;
  requestPageSizeUpdate: RequestPageSizeUpdate;
  viewPageNumber: ViewPageNumber;
  showHideAddColumnsDialog: ShowHideAddColumnsDialog;
  updateColumnsDialogSelection: UpdateColumnsDialogSelection;
  updateColumnsDialogExpandedNodes: UpdateColumnsDialogExpandedNodes;
  openAttributeAnalysis: OpenAttributeAnalysis;
  closeAttributeAnalysis: CloseAttributeAnalysis;
  updateSelectedIds: UpdateSelectedIds;
}

const cx = makeClassNameHelper('ResultTableSummaryView');

export default function ResultTableSummaryView({
  answer,
  answerLoading,
  addingStepToBasket,
  actions,
  selectedIds,
  activeAttributeAnalysisName,
  stepId,
  recordClass,
  question,
  basketStatusArray,
  requestColumnsChoiceUpdate,
  requestSortingUpdate,
  requestUpdateBasket,
  requestAddStepToBasket,
  requestPageSizeUpdate,
  viewPageNumber,
  showHideAddColumnsDialog,
  columnsDialogExpandedNodes,
  columnsDialogIsOpen,
  columnsDialogSelection,
  columnsTree,
  updateColumnsDialogSelection,
  updateColumnsDialogExpandedNodes,
  openAttributeAnalysis,
  closeAttributeAnalysis,
  updateSelectedIds
}: Props) {
  return (
    <div className={cx()}>
      {(answerLoading || addingStepToBasket) && (
        <div className={cx('LoadingOverlay')}>
          <Loading className={cx('Loading')}>
            {answerLoading ? 'Loading results...' : 'Updating basket...'}
          </Loading>
        </div>
      )}
      {answer && question && columnsTree && (
        <ResultTableAddColumnsDialog
          answer={answer}
          question={question}
          columnsDialogExpandedNodes={columnsDialogExpandedNodes}
          columnsDialogIsOpen={columnsDialogIsOpen}
          columnsDialogSelection={columnsDialogSelection}
          columnsTree={columnsTree}
          showHideAddColumnsDialog={showHideAddColumnsDialog}
          updateColumnsDialogExpandedNodes={updateColumnsDialogExpandedNodes}
          updateColumnsDialogSelection={updateColumnsDialogSelection}
          requestColumnsChoiceUpdate={requestColumnsChoiceUpdate}
        />
      )}
      {answer && recordClass && question ? (
        <ResultTable
          answer={answer}
          actions={actions}
          selectedIds={selectedIds}
          activeAttributeAnalysisName={activeAttributeAnalysisName}
          stepId={stepId}
          question={question}
          recordClass={recordClass}
          basketStatusArray={basketStatusArray}
          requestColumnsChoiceUpdate={requestColumnsChoiceUpdate}
          requestSortingUpdate={requestSortingUpdate}
          requestUpdateBasket={requestUpdateBasket}
          requestAddStepToBasket={requestAddStepToBasket}
          requestPageSizeUpdate={requestPageSizeUpdate}
          viewPageNumber={viewPageNumber}
          showHideAddColumnsDialog={showHideAddColumnsDialog}
          openAttributeAnalysis={openAttributeAnalysis}
          closeAttributeAnalysis={closeAttributeAnalysis}
          updateSelectedIds={updateSelectedIds}
        />
      ) : null}
    </div>
  );
}