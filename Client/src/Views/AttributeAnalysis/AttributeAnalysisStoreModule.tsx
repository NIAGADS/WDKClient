import { filter, map, withLatestFrom } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { Action } from 'wdk-client/Actions';
import { CompositeClientPlugin, PluginContext } from 'wdk-client/Utils/ClientPlugin';

import * as Data from 'wdk-client/Views/AttributeAnalysis/BaseAttributeAnalysis';
import { ScopedAction, SCOPED_ACTION } from 'wdk-client/Actions/AttributeAnalysisActions';
import { EpicDependencies } from 'wdk-client/Core/Store';
import { LocatePlugin } from 'wdk-client/Core/CommonTypes';

export type State = {
  analyses: Record<string, Data.State<string> | undefined>
};

const initialState = {
  analyses: {}
};

export const key = 'attributeAnalysis';

function isScopedAction(action: { type: string }): action is ScopedAction {
  return action.type === SCOPED_ACTION;
}

export function reduce(state: State = initialState, action: Action, locatePlugin: LocatePlugin): State {
  if (!isScopedAction(action)) {
    return state;
  }

  const { stepId, reporter, context } = action.payload;
  const key = stepId + '__' + reporter.name;
  return {
    ...state,
    analyses: {
      ...state.analyses,
      [key]: locatePlugin<State['analyses'][string]>('attributeAnalysis').reduce(context, state.analyses[key], action.payload.action)
    }
  };
}

export function observe(action$: Observable<Action>, state$: Observable<any>, dependencies: EpicDependencies) {
  const attributeAnalysisState$ = state$.pipe(
    map(state => state[key])
  );

  return scopePluginObserve(dependencies.locatePlugin('attributeAnalysis').observe)(action$, attributeAnalysisState$, dependencies);
}

function scopePluginObserve(observe: CompositeClientPlugin<State>['observe']) {
  return function scopedObserve(action$: Observable<Action>, state$: Observable<State>, dependencies: EpicDependencies) {
    const scopedParentAction$ = action$.pipe(filter(isScopedAction));
    const contextActionPair$ = scopedParentAction$.pipe(map(action => [ action.payload.context, action.payload.action ] as [PluginContext, Action]));
    const scopedChildAction$ = observe(contextActionPair$, state$, dependencies);
    
    return scopedChildAction$.pipe(
      withLatestFrom(scopedParentAction$, (child, parent) => ({ child, parent })),
      map(({ child, parent }) => {
        return { ...parent, payload: { ...parent.payload, action: child } }
      })
    );
  };
}
