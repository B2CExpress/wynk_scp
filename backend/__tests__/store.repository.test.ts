import { escapeLikePattern } from '../src/repositories/store.repository';

describe('escapeLikePattern', () => {
  it('escapes % to prevent wildcard injection (regression of bf21c78)', () => {
    // Sem escape, `?search=50%` retornaria todas as lojas.
    expect(escapeLikePattern('50%')).toBe('50\\%');
    expect(escapeLikePattern('100%')).toBe('100\\%');
  });

  it('escapes _ to prevent single-char wildcard', () => {
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
  });

  it('escapes backslash (must come first in the regex)', () => {
    expect(escapeLikePattern('path\\file')).toBe('path\\\\file');
  });

  it('escapes all three wildcards combined', () => {
    expect(escapeLikePattern('50%_\\foo')).toBe('50\\%\\_\\\\foo');
  });

  it('leaves regular text untouched', () => {
    expect(escapeLikePattern('mcdonald')).toBe('mcdonald');
    expect(escapeLikePattern('café & cia.')).toBe('café & cia.');
  });
});
