import { Av, renderIcon, When } from './ui';

import type { StackRow } from '../app/stack';

interface StackNode {
  row: StackRow;
  children: StackNode[];
}

// The rows come in depth-first order, so a row's parent is the latest row one level up.
const buildTree = (rows: StackRow[]): StackNode[] => {
  const roots: StackNode[] = [];
  const path: StackNode[] = [];

  for (const row of rows) {
    const node: StackNode = { row, children: [] };
    path.length = row.depth;
    (path[row.depth - 1]?.children ?? roots).push(node);
    path[row.depth] = node;
  }

  return roots;
};

interface StackNodeProps {
  node: StackNode;
  repo: string;
  open: (event: MouseEvent) => void;
}

const StackItem = ({ node, repo, open }: StackNodeProps) => {
  const row = node.row;

  return (
    <>
      <div class={`stack-item${node.children.length ? ' link' : ''}`}>
        <span class={`stack-dot${row.current ? ' current' : ''}`}>
          {renderIcon(
            row.draft ? 'git-pull-request-draft' : 'git-pull-request',
            12,
          )}
        </span>
        <a
          class={`stack-card${row.current ? ' current' : ''}`}
          data-open={row.current ? undefined : `${repo}#${row.number}`}
          onClick={row.current ? undefined : open}
        >
          <div class="stack-top">
            <b>{row.title}</b>
            <span class="num">#{row.number}</span>
          </div>
          <div class="stack-branches">
            <span class="branch">{row.branch}</span>
            <span class="stack-arrow">→</span>
            <span class="branch">{row.base}</span>
          </div>
          <div class="stack-meta">
            {row.user && Av(row.user, 18)}
            <span>{row.user?.login}</span>
            {row.draft && <span class="stack-tag">Draft</span>}
            {row.current && <span class="stack-tag here">This PR</span>}
            <span class="stack-when">{When(row.updated)}</span>
          </div>
        </a>
      </div>
      <StackChildren nodes={node.children} repo={repo} open={open} />
    </>
  );
};

// One child continues the line straight down; several fork off it with an elbow each.
const StackChildren = ({
  nodes,
  repo,
  open,
}: {
  nodes: StackNode[];
  repo: string;
  open: (event: MouseEvent) => void;
}) =>
  nodes.length === 1 ? (
    <StackItem node={nodes[0]} repo={repo} open={open} />
  ) : nodes.length > 1 ? (
    <div class="stack-fork">
      {nodes.map(node => (
        <div key={node.row.number} class="stack-branch">
          <StackItem node={node} repo={repo} open={open} />
        </div>
      ))}
    </div>
  ) : null;

export const StackView = ({
  repo,
  rows,
  open,
}: {
  repo: string;
  rows: StackRow[];
  open: (event: MouseEvent) => void;
}) => {
  if (rows.length < 2) {
    return (
      <div class="diff-empty">
        No other pull requests are stacked with this one.
      </div>
    );
  }

  const [root, ...rest] = rows;

  return (
    <div class="stack-view">
      <p class="stack-intro">
        The branches this pull request builds on, from where the stack lands up
        to its tip. A pull request sits on the one above it.
      </p>
      <div class="stack-list">
        <div class="stack-item link">
          <span class="stack-dot root">{renderIcon('git-merge', 12)}</span>
          <div class="stack-root">
            <span class="branch">{root.branch}</span>
            <span class="stack-note">the stack lands here</span>
          </div>
        </div>
        <StackChildren nodes={buildTree(rest)} repo={repo} open={open} />
      </div>
    </div>
  );
};
