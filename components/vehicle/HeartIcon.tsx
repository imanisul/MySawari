import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Figma heart (18x19 artwork): 1px outline, filled when saved.
const HEART_PATH =
  "M1.5 7.5193C1.50002 6.63833 1.7532 5.77809 2.2261 5.0522C2.699 4.3263 3.36939 3.7689 4.14871 3.45361C4.92803 3.13833 5.77962 3.07998 6.59101 3.28629C7.4024 3.4926 8.13542 3.95385 8.69325 4.60913C8.73254 4.65348 8.78004 4.68883 8.83281 4.713C8.88557 4.73717 8.94248 4.74964 9 4.74964C9.05752 4.74964 9.11443 4.73717 9.16719 4.713C9.21996 4.68883 9.26746 4.65348 9.30675 4.60913C9.86283 3.94959 10.596 3.48446 11.4087 3.27565C12.2214 3.06684 13.0751 3.12424 13.8562 3.44022C14.6372 3.75621 15.3085 4.31578 15.7808 5.04447C16.2531 5.77316 16.504 6.6364 16.5 7.5193C16.5 9.33222 15.375 10.686 14.25 11.8735L10.131 16.0796C9.99125 16.249 9.81895 16.3851 9.62553 16.4788C9.43212 16.5726 9.22203 16.6218 9.00922 16.6232C8.7964 16.6246 8.58574 16.5782 8.39122 16.4871C8.19669 16.396 8.02277 16.2622 7.881 16.0946L3.75 11.8735C2.625 10.686 1.5 9.34013 1.5 7.5193Z";

export function HeartIcon({ width, height, color, filled, strokeWidth = 1 }: { width: number; height: number; color: string; filled?: boolean; strokeWidth?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 18 19" fill={filled ? color : 'none'}>
      <Path d={HEART_PATH} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
