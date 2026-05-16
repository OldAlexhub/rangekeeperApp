import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, Typography } from '../theme/colors';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  unit?: string;
  referenceY?: number;
  referenceLabel?: string;
}

export function LineChart({
  data,
  width = 320,
  height = 160,
  color = Colors.primary,
  unit = '',
  referenceY,
  referenceLabel,
}: LineChartProps) {
  if (data.length < 2) return null;

  const padLeft = 44;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 28;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const minX = Math.min(...data.map(d => d.x));
  const maxX = Math.max(...data.map(d => d.x));
  const rawMinY = Math.min(...data.map(d => d.y));
  const rawMaxY = Math.max(...data.map(d => d.y));

  const allYVals = referenceY !== undefined
    ? [...data.map(d => d.y), referenceY]
    : data.map(d => d.y);
  const minY = Math.min(...allYVals) * 0.97;
  const maxY = Math.max(...allYVals) * 1.03;

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const toSvgX = (x: number) => padLeft + ((x - minX) / rangeX) * chartW;
  const toSvgY = (y: number) => padTop + (1 - (y - minY) / rangeY) * chartH;

  const points = data.map(d => `${toSvgX(d.x)},${toSvgY(d.y)}`).join(' ');

  const refY = referenceY !== undefined ? toSvgY(referenceY) : null;

  const yLabels = [minY, (minY + maxY) / 2, maxY];

  return (
    <View>
      <Svg width={width} height={height}>
        {yLabels.map((val, i) => {
          const svgY = toSvgY(val);
          return (
            <React.Fragment key={i}>
              <Line
                x1={padLeft}
                y1={svgY}
                x2={width - padRight}
                y2={svgY}
                stroke={Colors.border}
                strokeWidth={0.5}
              />
              <SvgText
                x={padLeft - 4}
                y={svgY + 4}
                fontSize={9}
                fill={Colors.textMuted}
                textAnchor="end">
                {Math.round(val)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {refY !== null && (
          <>
            <Line
              x1={padLeft}
              y1={refY}
              x2={width - padRight}
              y2={refY}
              stroke={Colors.warning}
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            {referenceLabel ? (
              <SvgText
                x={width - padRight - 2}
                y={refY - 3}
                fontSize={8}
                fill={Colors.warning}
                textAnchor="end">
                {referenceLabel}
              </SvgText>
            ) : null}
          </>
        )}

        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((d, i) => (
          <Circle
            key={i}
            cx={toSvgX(d.x)}
            cy={toSvgY(d.y)}
            r={3}
            fill={color}
          />
        ))}
      </Svg>
    </View>
  );
}
