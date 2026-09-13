import React from 'react';

export function ConnectionBadge({ state }) {
  let label = 'Disconnected';
  let badgeClass = 'disconnected';

  if (state === 'CONNECTED') {
    label = 'Connected';
    badgeClass = 'connected';
  } else if (state === 'WAITING' || state === 'CONNECTING') {
    label = state === 'WAITING' ? 'Waiting for Peer...' : 'Connecting...';
    badgeClass = 'waiting';
  } else if (state === 'RECONNECTING') {
    label = 'Reconnecting...';
    badgeClass = 'waiting';
  }

  return (
    <div className={`connection-badge ${badgeClass}`}>
      <span className="pulse-dot" />
      <span>{label}</span>
    </div>
  );
}
