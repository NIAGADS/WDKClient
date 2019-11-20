import { stubTrue as isParamValueValid } from 'lodash';
import React from 'react';

import TextArea from 'wdk-client/Components/InputControls/TextArea';
import TextBox from 'wdk-client/Components/InputControls/TextBox';
import { StringParam, Parameter } from 'wdk-client/Utils/WdkModel';

import { createParamModule, Props } from 'wdk-client/Views/Question/Params/Utils';

export default createParamModule({
  isType,
  isParamValueValid,
  Component
})

export const DEFAULT_COLS = 45;
export const calculateRows = (parameter: StringParam, cols: number) =>
  Math.min(20, Math.ceil(parameter.length / cols ));

function isType(param: Parameter): param is StringParam {
  return param.type === 'string';
}

function Component(props: Props<StringParam, undefined>) {
  const { parameter, value, onParamValueChange } = props;
  const cols = DEFAULT_COLS;
  const rows = calculateRows(parameter, cols);
  return parameter.length <= 50 ? (
    <TextBox
      type="text"
      value={value}
      readOnly={parameter.isReadOnly}
      onChange={onParamValueChange}
      required={!parameter.allowEmptyValue}
    />
  ) : (
    <TextArea
      cols={cols}
      rows={rows}
      readOnly={parameter.isReadOnly}
      value={value}
      onChange={onParamValueChange}
      required={!parameter.allowEmptyValue}
    />
  );
}
