import React, { useState } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { createSelector } from 'reselect';

import { updateParamValue } from 'wdk-client/Actions/QuestionActions';
import { Loading } from 'wdk-client/Components';
import { RootState } from 'wdk-client/Core/State/Types';
import { useWdkEffect } from 'wdk-client/Service/WdkService';
import { QuestionState } from 'wdk-client/StoreModules/QuestionStoreModule';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';
import { Parameter } from 'wdk-client/Utils/WdkModel';
import { AddStepOperationFormProps } from 'wdk-client/Views/Strategy/AddStepPanel';
import { BooleanSelect } from 'wdk-client/Views/Strategy/BooleanSelect';
import { StrategyInputSelector } from 'wdk-client/Views/Strategy/StrategyInputSelector';
import { BOOLEAN_OPERATOR_PARAM_NAME, CombineOperator } from 'wdk-client/Views/Strategy/StrategyUtils';

import 'wdk-client/Views/Strategy/CombineWithStrategyForm.scss';

const cx = makeClassNameHelper('CombineWithStrategyForm');

type StateProps = {
  booleanSearchUrlSegment: string,
  booleanSearchState?: QuestionState,
  booleanOperatorParameter?: Parameter
};

type DispatchProps = {
  updateParamValue: (payload: {
    searchName: string,
    parameter: Parameter, 
    paramValues: Record<string, string>, 
    paramValue: string
  }) => void
};

const recordClassSegment = createSelector(
  (_: RootState, { inputRecordClass }: OwnProps) => inputRecordClass,
  recordClass => recordClass && recordClass.fullName.replace('.', '_')
);

const booleanSearchUrlSegment = createSelector(
  recordClassSegment,
  recordClassSegment => `boolean_question_${recordClassSegment}`
);

const booleanSearchState = createSelector(
  ({ question: { questions } }: RootState) => questions,
  booleanSearchUrlSegment,
  (questions, booleanSearchUrlSegment) => questions[booleanSearchUrlSegment]
);

const booleanOperatorParameter = createSelector(
  booleanSearchState,
  booleanSearchState => {
    if (!booleanSearchState || booleanSearchState.questionStatus === 'loading') {
      return undefined;
    }

    const booleanOperatorEntry = booleanSearchState.question.parametersByName[BOOLEAN_OPERATOR_PARAM_NAME];

    if (!booleanOperatorEntry) {
      return undefined;
    }

    return booleanOperatorEntry;
  }
);

type OwnProps = AddStepOperationFormProps;

type CombineStepFormViewProps = StateProps & {
  updateBooleanOperator: (newBooleanOperator: CombineOperator) => void,
} & OwnProps;

const CombineWithStrategyFormView = ({
  booleanSearchState,
  booleanSearchUrlSegment,
  addType,
  inputRecordClass,
  updateBooleanOperator,
  stepsCompletedNumber,
  strategy,
  updateStrategy
}: CombineStepFormViewProps) => {
  const [ selectedStrategyId, setSelectedStrategyId ] = useState<number | undefined>(undefined);

  useWdkEffect(wdkService => {
    if (selectedStrategyId !== undefined && booleanSearchState && booleanSearchState.paramValues) {
      const operatorStepPromise = wdkService.createStep({
        searchName: booleanSearchUrlSegment,
        searchConfig: {
          parameters: booleanSearchState.paramValues
        },
        customName: booleanSearchState.question.displayName
      });

      const duplicateStepTreePromise = wdkService.getDuplicatedStrategyStepTree(selectedStrategyId);

      Promise.all([
        operatorStepPromise,
        duplicateStepTreePromise
      ]).then(([{ id: operatorStepId }, duplicateStepTree]) => {
        updateStrategy(operatorStepId, duplicateStepTree);
      });
    }
  }, [ selectedStrategyId ]);

  return !booleanSearchState || booleanSearchState.questionStatus === 'loading'
    ? <Loading />
    : <div className={cx()}>
        <div className={cx('--Header')}>
          <h2>
            Choose an existing {inputRecordClass.displayNamePlural} strategy
          </h2>

          <div className={cx('--BooleanOperatorMenu')}>
            The results will be{' '}
            <BooleanSelect
              value={booleanSearchState && booleanSearchState.paramValues[BOOLEAN_OPERATOR_PARAM_NAME] as CombineOperator}
              onChange={updateBooleanOperator}
              addType={addType}
            />
            {' '}the results of Step {stepsCompletedNumber}.
          </div>
        </div>
        <div className={cx('--Body')}>
          {
            selectedStrategyId !== undefined
              ? <Loading />
              : <StrategyInputSelector
                  onStrategySelected={setSelectedStrategyId}
                  primaryInput={strategy}
                  secondaryInputRecordClass={inputRecordClass}
                  selectedStrategyId={selectedStrategyId}
                />
          }
        </div>
      </div>;
};

export const CombineWithStrategyForm = connect<StateProps, DispatchProps, OwnProps, CombineStepFormViewProps, RootState>(
  (state, ownProps) => ({
    booleanSearchUrlSegment: booleanSearchUrlSegment(state, ownProps),
    booleanSearchState: booleanSearchState(state, ownProps),
    booleanOperatorParameter: booleanOperatorParameter(state, ownProps)
  }),
  dispatch => ({
    updateParamValue: compose(dispatch, updateParamValue)
  }),
  (stateProps, dispatchProps, ownProps) => ({
    ...stateProps,
    updateBooleanOperator: (newBooleanOperator: CombineOperator) => {
      if (stateProps.booleanSearchState && stateProps.booleanOperatorParameter) {
        dispatchProps.updateParamValue({
          searchName: stateProps.booleanSearchUrlSegment,
          parameter: stateProps.booleanOperatorParameter,
          paramValues: stateProps.booleanSearchState.paramValues,
          paramValue: newBooleanOperator
        });
      }
    },
    ...ownProps
  })
)(CombineWithStrategyFormView);
