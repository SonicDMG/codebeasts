/* eslint-env jest */
import { buildActionFigurePrompt } from './promptUtils';
import { ACTION_FIGURE_PROMPT_TEMPLATE, ACTION_FIGURE_PROMPT_WITH_IMAGE_TEMPLATE } from './promptTemplates';
import {
  normalizeAnimalSelection,
  processAnimalSelection,
  cleanLanguagesString,
  cleanGithubUrl
} from './promptUtils';

describe('buildActionFigurePrompt', () => {
  const username = 'beth';
  const figureDescription = 'a legendary coder with a love for animals';
  const languages = 'JavaScript, Python';
  const baseConceptPrompt = 'Base concept';
  const animalSelection = [
    ['cat', 'for JavaScript'],
    ['dog', 'for Python']
  ];

  it('replaces all template variables globally (no personFeatures)', () => {
    const prompt = buildActionFigurePrompt(
      ACTION_FIGURE_PROMPT_TEMPLATE,
      username,
      figureDescription,
      animalSelection,
      languages,
      baseConceptPrompt
    );
    expect(prompt).not.toMatch(/\[Name\]|\[Title\]|\[X\]|\[key items\]|\[character description\]/);
    expect(prompt).toContain('Beth the Code Beast');
    expect(prompt).toContain('cat for JavaScript, dog for Python');
    expect(prompt).toContain('a legendary coder with a love for animals');
  });

  it('replaces all template variables globally (with personFeatures)', () => {
    const personFeatures = 'Short brown hair, glasses, blue shirt.';
    const prompt = buildActionFigurePrompt(
      ACTION_FIGURE_PROMPT_WITH_IMAGE_TEMPLATE,
      username,
      figureDescription,
      animalSelection,
      languages,
      baseConceptPrompt,
      personFeatures
    );
    expect(prompt).not.toMatch(/\[person_features\]/);
    expect(prompt).toContain(personFeatures);
    expect(prompt).toContain('Beth the Code Beast');
  });

  it('handles flat animalSelection array', () => {
    const flatSelection = ['cat for JavaScript', 'dog for Python'];
    const prompt = buildActionFigurePrompt(
      ACTION_FIGURE_PROMPT_TEMPLATE,
      username,
      figureDescription,
      flatSelection,
      languages,
      baseConceptPrompt
    );
    expect(prompt).toContain('cat for JavaScript, dog for Python');
  });

  it('handles undefined animalSelection', () => {
    const prompt = buildActionFigurePrompt(
      ACTION_FIGURE_PROMPT_TEMPLATE,
      username,
      figureDescription,
      undefined,
      languages,
      baseConceptPrompt
    );
    expect(prompt).not.toMatch(/\[key items\]/);
  });
});

describe('normalizeAnimalSelection', () => {
  it('returns array of arrays as-is', () => {
    const input = [['cat', 'for JS'], ['dog', 'for Python']];
    expect(normalizeAnimalSelection(input)).toEqual(input);
  });
  it('handles flat array of strings with " for "', () => {
    const input = ['cat for JS', 'dog for Python'];
    expect(normalizeAnimalSelection(input)).toEqual([
      ['cat for JS'],
      ['dog for Python']
    ]);
  });
  it('groups flat array of strings into pairs', () => {
    const input = ['cat', 'for JS', 'dog', 'for Python'];
    expect(normalizeAnimalSelection(input)).toEqual([
      ['cat', 'for JS'],
      ['dog', 'for Python']
    ]);
  });
  it('returns empty array for undefined', () => {
    expect(normalizeAnimalSelection(undefined)).toEqual([]);
  });
  it('wraps unknown structure', () => {
    expect(normalizeAnimalSelection(['cat', '42'])).toEqual([['cat', '42']]);
  });
});

describe('processAnimalSelection', () => {
  it('returns array of arrays as-is', () => {
    const input = [['cat', 'for JS'], ['dog', 'for Python']];
    expect(processAnimalSelection(input)).toEqual(input);
  });
  it('returns flat array of strings as-is', () => {
    const input = ['cat for JS', 'dog for Python'];
    expect(processAnimalSelection(input)).toEqual(input);
  });
  it('filters and trims strings in mixed array', () => {
    const input = ['cat', '', '  dog  '];
    expect(processAnimalSelection(input)).toEqual(['cat', '', '  dog  ']);
  });
  it('handles object entries in array', () => {
    const input = [{ cat: 'for JS' }, { dog: 'for Python' }];
    expect(processAnimalSelection(input)).toEqual(['cat: for JS', 'dog: for Python']);
  });
  it('wraps non-empty string', () => {
    expect(processAnimalSelection('cat for JS')).toEqual(['cat for JS']);
  });
  it('returns undefined for empty input', () => {
    expect(processAnimalSelection('')).toBeUndefined();
    expect(processAnimalSelection([])).toEqual([]);
  });
});

describe('cleanLanguagesString', () => {
  it('removes prefix, brackets, and quotes', () => {
    expect(cleanLanguagesString("languages: ['JS','Python']")).toBe('JS,Python');
  });
  it('returns empty string for undefined', () => {
    expect(cleanLanguagesString(undefined)).toBe('');
  });
});

describe('cleanGithubUrl', () => {
  it('returns fallback for undefined', () => {
    expect(cleanGithubUrl(undefined, 'beth')).toBe('https://github.com/beth');
  });
  it('returns fallback for malformed', () => {
    expect(cleanGithubUrl('not a url', 'beth')).toBe('https://github.com/beth');
  });
  it('extracts username from valid url', () => {
    expect(cleanGithubUrl('https://github.com/beth', 'beth')).toBe('https://github.com/beth');
  });
  it('extracts from url with path', () => {
    expect(cleanGithubUrl('https://github.com/beth/some-repo', 'beth')).toBe('https://github.com/beth/some-repo');
  });
}); 