import React from 'react';
import { wrappable } from 'wdk-client/Utils/ComponentUtils';
import { getId, getDisplayName, isIndividual } from 'wdk-client/Utils/CategoryUtils';
import { doesNotReject } from 'assert';

let RecordNavigationItem = ({node: category, path, activeCategory, checked, onSectionToggle}) => {
  let id = getId(category);
  let activeId = activeCategory && getId(activeCategory);
  // strip out anything in parantheses / truncate to ~20 characters (without breaking words)
  let displayName = getDisplayName(category).replace(/\(.+\)/, '').replace(/.{20}\S*\s+/g, "$&@").split(/\s+@/)[0];

  let enumeration = isIndividual(category)
    ? null
    : path.map(n => n + 1).join('.');

  let divClassName = path.length == 1 ? "wdk-RecordNavigationSectionItem wdk-RecordNavigationItem" : "wdk-RecordNavigationItem";
  return (
    <div className={divClassName}>
      {activeId === id ? (
        <i className="fa fa-circle wdk-Link wdk-RecordNavigationIndicator"/>
      ) : null}
      {path.length == 1 &&
        <input
          className="wdk-Record-sidebar-checkbox"
          type="checkbox"
          checked={checked}
          onChange={(e) => void onSectionToggle(id, e.target.checked)}
        />
      }
      <a
        href={'#' + id}
        className="wdk-Record-sidebar-title"
        onClick={event => {
          if (checked) onSectionToggle(id, true);
          event.stopPropagation();
        }}
      > {enumeration} {displayName} </a>
    </div>
  );
};

export default wrappable(RecordNavigationItem);
