// scripts/fix-tokens.mjs
import fs from 'fs';

const FILE = './tokens.json'; // 당신의 토큰 파일 경로
const raw = fs.readFileSync(FILE, 'utf-8');
const json = JSON.parse(raw);

// 접두사가 필요한 참조 키
const needGlobal = [
  'fontFamilies',
  'fontWeights',
  'lineHeights',
  'fontSize',          // NOTE: 당신 JSON 키가 "fontSize" (복수 아님)
  'letterSpacing',
  'paragraphSpacing',
  'paragraphIndent',
  'textCase',
  'textDecoration',
];

// 값이 {something} 형태의 참조인지 검사
const isRef = (v) => typeof v === 'string' && /^\{[^}]+\}$/.test(v);

// {fontWeights.x} → {global.fontWeights.x} 로 치환
const fixRef = (v) => {
  const inner = v.slice(1, -1); // { ... } 내용
  for (const key of needGlobal) {
    if (inner.startsWith(`${key}.`)) {
      return `{global.${inner}}`;
    }
  }
  return v;
};

// 객체를 순회하며 모든 value를 교정
const walk = (obj) => {
  if (Array.isArray(obj)) return obj.forEach(walk);
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const val = obj[k];
      if (val && typeof val === 'object') {
        walk(val);
      } else if (isRef(val)) {
        obj[k] = fixRef(val);
      }
    }
  }
};

walk(json);

// 저장
fs.writeFileSync(FILE, JSON.stringify(json, null, 2));
console.log('✔ tokens.json reference patched (added {global.} prefixes where needed).');
