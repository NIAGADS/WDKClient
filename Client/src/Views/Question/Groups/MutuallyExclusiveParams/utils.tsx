import { Dictionary, mapValues, values } from 'lodash';
import { createSelector } from 'reselect';

import { QuestionState } from 'wdk-client/StoreModules/QuestionStoreModule';
import { Parameter } from 'wdk-client/Utils/WdkModel';

const findXorGroupKey = (xorGrouping: Dictionary<string[]>) => (state: QuestionState): string => {
  const xorGroup = state.question.groups.find(group => {
    const groupParameterSet = new Set(group.parameters);

    return values(xorGrouping).every(
      xorGroupKeys => xorGroupKeys.some(
        xorGroupKey => groupParameterSet.has(xorGroupKey)
      )
    );
  });

  return xorGroup === undefined
    ? 'hidden'
    : xorGroup.name;
}

const groupXorParameters = (xorGrouping: Dictionary<string[]>) => (state: QuestionState, xorGroupKey: string): Dictionary<string[]> => {
  const xorGroupingUniverse = values(xorGrouping).flat();
  const xorGroupingSets = mapValues(xorGrouping, parameterKeys => new Set(parameterKeys));
  const xorGroupingNegations = mapValues(xorGroupingSets, parameterSet => {
    const negation = xorGroupingUniverse.filter(parameterKey => !parameterSet.has(parameterKey));
    return new Set(negation);
  });

  const xorGroup = state.question.groupsByName[xorGroupKey];

  return xorGroup === undefined
    ? mapValues(
      xorGroupingNegations,
      () => []
    )
    : mapValues(
      xorGroupingNegations,
      xorGroupingNegation => xorGroup.parameters.filter(parameter =>
        !xorGroupingNegation.has(parameter)
      )
    );
};

const xorGroupingByChromosomeAndSequenceID = {
  'Chromosome': ['organismSinglePick', 'chromosomeOptional', 'chromosomeOptionalForNgsSnps'],
  'Sequence ID': ['sequenceId']
};

export const keyForXorGroupingByChromosomeAndSequenceID = createSelector(
  (state: QuestionState) => state,
  findXorGroupKey(xorGroupingByChromosomeAndSequenceID)
);

export const groupXorParametersByChromosomeAndSequenceID = createSelector(
  (state: QuestionState) => state,
  keyForXorGroupingByChromosomeAndSequenceID,
  groupXorParameters(xorGroupingByChromosomeAndSequenceID)
);

export const restrictParameters = (state: QuestionState, parameterKeys: string[]): QuestionState => {
  const parameterKeySet = new Set(parameterKeys);

  return {
    ...state,
    question: {
      ...state.question,
      parameters: state.question.parameters.filter(({ name }) => parameterKeySet.has(name))
    }
  };
};
