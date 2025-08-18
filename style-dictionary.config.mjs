import StyleDictionary from 'style-dictionary';
import { register, getTransforms } from '@tokens-studio/sd-transforms';

// 1) Tokens Studio 변환 등록
register(StyleDictionary);

// 2) 세트 필터(함수 아님, '이름' 등록)
StyleDictionary.registerFilter({ name: 'set/global',      filter: (t) => t.path && t.path[0] === 'global' });
StyleDictionary.registerFilter({ name: 'set/color-light', filter: (t) => t.path && t.path[0] === 'Color/Light' });
StyleDictionary.registerFilter({ name: 'set/color-dark',  filter: (t) => t.path && t.path[0] === 'Color/Dark' });

// 3) sd-transforms가 제공하는 css 변환 목록에서 shorthand만 제거
const baseCssTransforms = getTransforms({ platform: 'css' });
const transformsNoShorthand = baseCssTransforms.filter(t => t !== 'ts/typography/shorthand');

// 4) 커스텀 포맷터: 경로 기반 케밥 네이밍 + 타이포그래피를 개별 속성 변수로 분해 출력
StyleDictionary.registerFormat({
  name: 'css/variables-kebab-path-typography',
  // v5: formatter 대신 format 사용
  format: ({ dictionary, options }) => {
    const selector = (options && options.selector) || ':root';

    const toVarName = (pathArr) =>
      '--' +
      pathArr
        .map(s => String(s)
          .replace(/\s+/g, '-')        // 공백 → -
          .replace(/[^\w-]/g, '-')     // 특수문자 정리
          .replace(/-+/g, '-')
          .toLowerCase()
        )
        .join('-');

    const lines = [];
    lines.push('/**');
    lines.push(' * Do not edit directly, this file was auto-generated.');
    lines.push(' */\n');
    lines.push(`${selector} {`);

    for (const token of dictionary.allTokens) {
      const name = toVarName(token.path);

      if (token.value !== null && typeof token.value === 'object') {
        for (const [k, v] of Object.entries(token.value)) {
          const subName = toVarName([...token.path, k]);
          lines.push(`  ${subName}: ${v};`);
        }
      } else {
        lines.push(`  ${name}: ${token.value};`);
      }
    }

    lines.push('}');
    return lines.join('\n');
  }
});


// 5) v5 호환 transformGroup (value-transform만)
StyleDictionary.registerTransformGroup({
  name: 'tokens-studio-css-no-shorthand',
  transforms: transformsNoShorthand
});

export default {
  source: ['tokens.json'],
  preprocessors: ['tokens-studio'],
  platforms: {
    css: {
      transformGroup: 'tokens-studio-css-no-shorthand',
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'tokens-root.css',
          // 기본 css/variables 포맷 대신, 우리가 등록한 포맷 사용
          format: 'css/variables-kebab-path-typography',
          filter: 'set/global',
          options: { selector: ':root', outputReferences: true }
        },
        {
          destination: 'tokens-light.css',
          format: 'css/variables-kebab-path-typography',
          filter: 'set/color-light',
          options: { selector: '[data-theme="light"]', outputReferences: true }
        },
        {
          destination: 'tokens-dark.css',
          format: 'css/variables-kebab-path-typography',
          filter: 'set/color-dark',
          options: { selector: '[data-theme="dark"]', outputReferences: true }
        }
      ]
    }
  }
};
