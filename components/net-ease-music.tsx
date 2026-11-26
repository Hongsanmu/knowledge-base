interface NetEaseMusicProps {
  id: string | number;
  type?: number;
  auto?: number;
  height?: number;
}

export function NetEaseMusic({ id, type = 2, auto = 0, height = 66 }: NetEaseMusicProps) {
  const src = `https://music.163.com/outchain/player?type=${type}&id=${id}&auto=${auto}&height=${height}`;

  return (
    <iframe
      title="NetEase Music Player"
      frameBorder="no"
      marginWidth={0}
      marginHeight={0}
      width="100%"
      height={height === 66 ? 86 : height + 20}
      src={src}
      allow="autoplay"
    />
  );
}
