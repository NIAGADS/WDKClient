import React, {useState, useRef, useEffect} from 'react';
import {StrategySummary, StrategyProperties, SaveStrategyOptions} from 'wdk-client/Utils/WdkUser';
import {makeClassNameHelper} from 'wdk-client/Utils/ComponentUtils';
import {formatDateTimeString} from 'wdk-client/Views/Strategy/StrategyUtils';
import Mesa, {MesaState} from 'wdk-client/Components/Mesa';

import './SaveAsStrategyForm.scss';
import {Link} from 'react-router-dom';

interface Props {
  strategy: StrategySummary;
  strategySummaries: StrategySummary[];
  clearActiveModal: () => void;
  saveStrategy: (strategyId: number, targetName: string, options: SaveStrategyOptions) => void;
}

interface CellRenderProps<T> {
  row: StrategySummary;
  value: T;
}

const cx = makeClassNameHelper('SaveAsStrategyForm')
const classPrefix_TableCell = '--TableCell';

const mesaColumns = [
  {
    key: 'name',
    name: 'Name',
    sortable: true,
    className: cx(classPrefix_TableCell, 'name')
  },
  {
    key: 'leafAndTransformStepCount',
    name: '# steps',
    sortable: true,
    className: cx(classPrefix_TableCell, 'leafAndTransformStepCount')
  },
  {
    key: 'isPublic',
    name: 'Public',
    sortable: true,
    className: cx(classPrefix_TableCell, 'isPublic'),
    renderCell: ({ value }: CellRenderProps<boolean>) =>
      <input type="checkbox" readOnly disabled checked={value}/>
  },
  {
    key: 'lastModified',
    name: 'Modified',
    sortable: true,
    className: cx(classPrefix_TableCell, 'lastModified'),
    renderCell: ({ value }: CellRenderProps<string>) =>
      formatDateTimeString(value)
  },
  {
    key: 'estimatedSize',
    name: 'Result size',
    className: cx(classPrefix_TableCell, 'estimatedSize'),
    sortable: true,
    renderCell: ({ value }: CellRenderProps<number|undefined>) => value == null ? '?' : value.toLocaleString()
  }
];

export default function SaveAsStrategyForm(props: Props) {
  const { strategy, strategySummaries } = props;
  const [ name, setName ] = useState(strategy.name);
  const [ selectedStrategyId, setSelectedStrategyId ] = useState<number | null>(strategy.strategyId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [selectedStrategyId])

  if (strategySummaries == null) return null;

  const mesaRows = strategySummaries.filter(s => s.isSaved && s.recordClassName === strategy.recordClassName);
  const tableState = MesaState.create({
    rows: mesaRows,
    columns: mesaColumns,
    options: {
      useStickyHeader: true,
      tableBodyMaxHeight: '50vh',
      deriveRowClassName: (s: StrategySummary) => cx('--TableRow', s.strategyId === selectedStrategyId ? 'selected' : 'unselected'),
      onRowClick: (s: StrategySummary) => {
        setName(s.name);
        setSelectedStrategyId(s.strategyId);
      }
    }
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.saveStrategy(props.strategy.strategyId, name, { removeOrigin: !strategy.isSaved });
    props.clearActiveModal();
  }

  function handleCancel(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    props.clearActiveModal();
  }

  return (
    <div className={cx()}>
      <div className="SaveStrategyForm--Notes">
        <p className="important">
          <strong>NOTE:</strong> You will be saving the <strong>configuration</strong> of this search strategy, <strong>not the data</strong> in the result.
        </p>
        <ul>
          <li>Re-running the saved search strategy might yield different results in subsequent releases of the site, if the underlying data have changed.</li>
          <li>To store the exact data in this result, please <Link to={`/step/${props.strategy.rootStepId}/download`}>download the result</Link>.</li>
        </ul>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={cx('--SelectorPanel')}>
          <Mesa state={tableState}></Mesa>
          <div className={cx('--InputLine')}>
            <label htmlFor="saveAsInput">Save as</label>
            <input
              autoFocus
              id="saveAsInput"
              type="text"
              ref={inputRef}
              onFocus={e => e.target.select()}
              value={name}
              onChange={e => { setName(e.target.value); setSelectedStrategyId(null); }}
            />
            <div className={cx('--Buttons')}>
              <button type="submit" className="btn">Save</button>
              <button type="submit" className="btn" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
