/* eslint-disable sort-keys-fix/sort-keys-fix */
import { shadowColors } from '../color/palettes';
import type { ShadowColor } from '../color/palettes';
import { CustomColor } from '../color/useForegroundColor';

export { shadowColors };
export type { ShadowColor };

const defaultShadowColor = 'shadow';

export type ShadowValue = {
  color?: ShadowColor | CustomColor;
  offset: {
    x: number;
    y: number;
  };
  opacity: number;
  blur: number;
}[];

export const shadowHierarchy = {
  '9px medium': [
    {
      offset: { x: 0, y: 1 },
      blur: 3,
      opacity: 0.12,
    },
    {
      offset: { x: 0, y: 3 },
      blur: 9,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '12px medium': [
    {
      offset: { x: 0, y: 2 },
      blur: 4,
      opacity: 0.12,
    },
    {
      offset: { x: 0, y: 6 },
      blur: 12,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '12px heavy': [
    {
      offset: { x: 0, y: 2 },
      blur: 4,
      opacity: 0.3,
    },
    {
      offset: { x: 0, y: 6 },
      blur: 12,
      opacity: 0.1,
    },
  ] as ShadowValue,
  '21px light': [
    {
      offset: { x: 0, y: 3.5 },
      blur: 10.5,
      opacity: 0.06,
    },
    {
      offset: { x: 0, y: 7 },
      blur: 21,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '21px heavy': [
    {
      offset: { x: 0, y: 3.5 },
      blur: 10.5,
      opacity: 0.35,
    },
    {
      offset: { x: 0, y: 7 },
      blur: 21,
      opacity: 0.25,
    },
  ] as ShadowValue,
  '30px light': [
    {
      offset: { x: 0, y: 5 },
      blur: 15,
      opacity: 0.06,
    },
    {
      offset: { x: 0, y: 10 },
      blur: 30,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '30px medium': [
    {
      offset: { x: 0, y: 5 },
      blur: 15,
      opacity: 0.12,
    },
    {
      offset: { x: 0, y: 10 },
      blur: 30,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '30px heavy': [
    {
      offset: { x: 0, y: 5 },
      blur: 15,
      opacity: 0.4,
    },
    {
      offset: { x: 0, y: 10 },
      blur: 30,
      opacity: 0.2,
    },
  ] as ShadowValue,
} as const;
export type ShadowHierarchy = keyof typeof shadowHierarchy;

export const shadows = Object.entries(shadowHierarchy).reduce(
  (currentShadows, [key, hierarchy]) => {
    const nextShadows = shadowColors.reduce(
      (currentShadows, color) => ({
        ...currentShadows,
        [`${key} ${color}`]: hierarchy.map((attrs, i) => ({
          ...attrs,
          color: i === hierarchy.length - 1 ? defaultShadowColor : color,
        })),
      }),
      {}
    );

    return {
      ...currentShadows,
      [key]: hierarchy.map(attrs => ({ ...attrs, color: defaultShadowColor })),
      ...nextShadows,
    };
  },
  {}
) as { [key in ShadowKey]: ShadowValue };

type ShadowKey = `${ShadowHierarchy}${
  | ''
  | ` ${Exclude<ShadowColor, typeof defaultShadowColor>}`}`;
export type CustomShadow = {
  custom: ShadowValue;
};
export type Shadow = ShadowKey | CustomShadow;
