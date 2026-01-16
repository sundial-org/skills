import {
  Separator,
  ValidationError,
  createPrompt,
  isDownKey,
  isEnterKey,
  isNumberKey,
  isSpaceKey,
  isTabKey,
  isUpKey,
  makeTheme,
  useKeypress,
  useMemo,
  usePagination,
  usePrefix,
  useState
} from '@inquirer/core';
import { cursorHide } from '@inquirer/ansi';
import figures from '@inquirer/figures';
import { styleText } from 'node:util';
import type { PartialDeep } from '@inquirer/type';
import type { Theme, Keybinding } from '@inquirer/core';

type CheckboxTheme = {
  icon: {
    checked: string;
    unchecked: string;
    cursor: string;
  };
  style: {
    disabledChoice: (text: string) => string;
    renderSelectedChoices: <T>(
      selectedChoices: ReadonlyArray<NormalizedChoice<T>>,
      allChoices: ReadonlyArray<NormalizedChoice<T> | Separator>
    ) => string;
    description: (text: string) => string;
    keysHelpTip: (keys: [key: string, action: string][]) => string | undefined;
  };
  keybindings: ReadonlyArray<Keybinding>;
};

type CheckboxShortcuts = {
  all?: string | null;
  invert?: string | null;
};

type Choice<Value> = {
  value: Value;
  name?: string;
  checkedName?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  checked?: boolean;
  type?: never;
};

type NormalizedChoice<Value> = {
  value: Value;
  name: string;
  checkedName: string;
  description?: string;
  short: string;
  disabled: boolean | string;
  checked: boolean;
};

function isSelectable<Value>(item: NormalizedChoice<Value> | Separator): item is NormalizedChoice<Value> {
  return !Separator.isSeparator(item) && !item.disabled;
}

function isChecked<Value>(item: NormalizedChoice<Value> | Separator): item is NormalizedChoice<Value> {
  return isSelectable(item) && item.checked;
}

function toggle<Value>(item: NormalizedChoice<Value> | Separator): NormalizedChoice<Value> | Separator {
  return isSelectable(item) ? { ...item, checked: !item.checked } : item;
}

function check<Value>(checked: boolean) {
  return function (item: NormalizedChoice<Value> | Separator): NormalizedChoice<Value> | Separator {
    return isSelectable(item) ? { ...item, checked } : item;
  };
}

function normalizeChoices<Value>(
  choices: readonly (string | Separator)[] | readonly (Separator | Choice<Value>)[]
): Array<NormalizedChoice<Value> | Separator> {
  return choices.map(choice => {
    if (Separator.isSeparator(choice)) return choice;

    if (typeof choice === 'string') {
      return {
        value: choice as Value,
        name: choice,
        short: choice,
        checkedName: choice,
        disabled: false,
        checked: false
      };
    }

    const name = choice.name ?? String(choice.value);
    const normalizedChoice: NormalizedChoice<Value> = {
      value: choice.value,
      name,
      short: choice.short ?? name,
      checkedName: choice.checkedName ?? name,
      disabled: choice.disabled ?? false,
      checked: choice.checked ?? false
    };

    if (choice.description) normalizedChoice.description = choice.description;
    return normalizedChoice;
  });
}

function nextSelectableIndex<Value>(
  items: Array<NormalizedChoice<Value> | Separator>,
  from: number,
  direction: -1 | 1
): number {
  let next = from;
  do {
    next = (next + direction + items.length) % items.length;
  } while (!isSelectable(items[next]));
  return next;
}

const checkboxTheme: Theme<CheckboxTheme> = {
  icon: {
    // Slightly larger/more visible rings by default vs the upstream checkbox prompt.
    checked: styleText('green', figures.circleFilled),
    unchecked: figures.circleDouble,
    cursor: figures.pointer
  },
  style: {
    disabledChoice: text => styleText('dim', `- ${text}`),
    renderSelectedChoices: selectedChoices => selectedChoices.map(choice => choice.short).join(', '),
    description: text => styleText('cyan', text),
    keysHelpTip: keys =>
      keys
        .map(([key, action]) => `${styleText('bold', key)} ${styleText('dim', action)}`)
        .join(styleText('dim', ' • '))
  },
  keybindings: []
};

/**
 * Checkbox prompt with additional toggle keys:
 * - Space toggles current item
 * - Tab toggles current item
 * - Left/Right arrows toggle current item
 */
export const checkboxExtended = createPrompt(<Value>(
  config: {
    message: string;
    prefix?: string;
    pageSize?: number;
    choices: readonly (string | Separator)[] | readonly (Separator | Choice<Value>)[];
    loop?: boolean;
    required?: boolean;
    validate?: (choices: readonly NormalizedChoice<Value>[]) => boolean | string | Promise<string | boolean>;
    theme?: PartialDeep<Theme<CheckboxTheme>>;
    shortcuts?: CheckboxShortcuts;
  },
  done: (value: Value[]) => void
) => {
  const { pageSize = 7, loop = true, required, validate = () => true } = config;
  const shortcuts = { all: 'a', invert: 'i', ...config.shortcuts };

  const theme = makeTheme(checkboxTheme, config.theme);
  const { keybindings } = theme;

  const [status, setStatus] = useState<'idle' | 'done'>('idle');
  const prefix = usePrefix({ status, theme });
  const [items, setItems] = useState<Array<NormalizedChoice<Value> | Separator>>(normalizeChoices(config.choices));

  const bounds = useMemo(() => {
    const first = items.findIndex(isSelectable);
    const last = items.findLastIndex(isSelectable);
    if (first === -1) {
      throw new ValidationError('[checkbox prompt] No selectable choices. All choices are disabled.');
    }
    return { first, last };
  }, [items]);

  const [active, setActive] = useState(bounds.first);
  const [errorMsg, setError] = useState<string | undefined>();

  useKeypress(async key => {
    if (isEnterKey(key)) {
      const selection = items.filter(isChecked);
      const isValid = await validate([...selection]);
      if (required && !items.some(isChecked)) {
        setError('At least one choice must be selected');
      } else if (isValid === true) {
        setStatus('done');
        done(selection.map(choice => choice.value));
      } else {
        setError(isValid || 'You must select a valid value');
      }
      return;
    }

    if (isUpKey(key, keybindings) || isDownKey(key, keybindings)) {
      if (
        loop ||
        (isUpKey(key, keybindings) && active !== bounds.first) ||
        (isDownKey(key, keybindings) && active !== bounds.last)
      ) {
        const direction: -1 | 1 = isUpKey(key, keybindings) ? -1 : 1;
        setActive(nextSelectableIndex(items, active, direction));
      }
      return;
    }

    const isLeftRight = key.name === 'left' || key.name === 'right';
    if (isSpaceKey(key) || isLeftRight) {
      setError(undefined);
      setItems(items.map((choice, i) => (i === active ? toggle(choice) : choice)));
      return;
    }

    if (isTabKey(key)) {
      setError(undefined);
      setItems(items.map((choice, i) => (i === active ? toggle(choice) : choice)));
      return;
    }

    if (key.name === shortcuts.all) {
      const selectAll = items.some(choice => isSelectable(choice) && !choice.checked);
      setItems(items.map(check(selectAll)));
      return;
    }

    if (key.name === shortcuts.invert) {
      setItems(items.map(toggle));
      return;
    }

    if (isNumberKey(key)) {
      const selectedIndex = Number(key.name) - 1;
      // Find the nth item (ignoring separators)
      let selectableIndex = -1;
      const position = items.findIndex(item => {
        if (Separator.isSeparator(item)) return false;
        selectableIndex++;
        return selectableIndex === selectedIndex;
      });

      const selectedItem = items[position];
      if (selectedItem && isSelectable(selectedItem)) {
        setActive(position);
        setItems(items.map((choice, i) => (i === position ? toggle(choice) : choice)));
      }
    }
  });

  const message = theme.style.message(config.message, status);
  let description: string | undefined;

  const page = usePagination({
    items,
    active,
    renderItem({ item, isActive }) {
      if (Separator.isSeparator(item)) return ` ${item.separator}`;

      if (item.disabled) {
        const disabledLabel = typeof item.disabled === 'string' ? item.disabled : '(disabled)';
        return theme.style.disabledChoice(`${item.name} ${disabledLabel}`);
      }

      if (isActive) description = item.description;

      const checkbox = item.checked ? theme.icon.checked : theme.icon.unchecked;
      const name = item.checked ? item.checkedName : item.name;
      const color = isActive ? theme.style.highlight : (x: string) => x;
      const cursor = isActive ? theme.icon.cursor : ' ';
      return color(`${cursor}${checkbox} ${name}`);
    },
    pageSize,
    loop
  });

  if (status === 'done') {
    const selection = items.filter(isChecked);
    const answer = theme.style.answer(theme.style.renderSelectedChoices(selection, items as any));
    return [prefix, message, answer].filter(Boolean).join(' ');
  }

  const keys: Array<[string, string]> = [
    ['↑↓', 'navigate'],
    ['space/tab/←→', 'toggle'],
  ];
  if (shortcuts.all) keys.push([shortcuts.all, 'all']);
  if (shortcuts.invert) keys.push([shortcuts.invert, 'invert']);
  keys.push(['⏎', 'submit']);

  const helpLine = theme.style.keysHelpTip(keys);

  const lines = [
    [prefix, message].filter(Boolean).join(' '),
    page,
    ' ',
    description ? theme.style.description(description) : '',
    errorMsg ? theme.style.error(errorMsg) : '',
    helpLine
  ]
    .filter(Boolean)
    .join('\n')
    .trimEnd();

  return `${lines}${cursorHide}`;
});

