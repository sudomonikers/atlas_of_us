import { useState, type CSSProperties, type ReactNode } from 'react';

// Draws a scene's picture as a stack of svgs instead of one. Safari can't composite an animation on a shape inside an
// svg, so it redraws the whole svg on the cpu every frame something in it moves. Here what moves gets an svg of its own,
// which it composites as a separate layer, and the still picture between is drawn once. Drawing order is kept, so what
// was on top stays on top.

export interface Layer {
  key: string;
  //what it moves with: neighbouring layers that move the same way share an svg. Left out for something that holds still
  moving?: string;
  //a blend can't reach past its own svg, so blended shapes get an svg of their own and the whole svg is blended
  blend?: 'screen' | 'multiply';
  //layers of different kinds never share an svg, for a picture that wraps each kind in its own filters (see wrap)
  kind?: string;
  node: ReactNode; //svg content, in the picture's coordinates
}

const fill: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

//one svg covering the scene, in the picture's coordinates
export function Sheet({ viewBox, style, className, children }: { viewBox: string; style?: CSSProperties; className?: string; children: ReactNode }) {
  return (
    <svg style={{ ...fill, ...style }} className={className} viewBox={viewBox} preserveAspectRatio="xMidYMid slice" aria-hidden>
      {children}
    </svg>
  );
}

interface Group {
  id: string;
  layers: Layer[];
}

//the layers in order, with neighbours that move, blend and wrap the same way sharing an svg. wrap puts each svg's
//content inside whatever its kind needs, such as a filter that has to see all of it at once. className and style go on
//the wrapper, for fading a whole page in or out.
//A layer keeps the svg it was first drawn in while parts come and go around it, since moving it to another svg would
//draw it afresh and play its entrance again. It only moves when something lands in the middle of its svg and splits it
const fits = (group: Group, layer: Layer) => {
  const first = group.layers[0];
  return first.moving === layer.moving && first.blend === layer.blend && first.kind === layer.kind;
};
export function Layers({
  viewBox,
  layers,
  wrap,
  className,
  style,
}: {
  viewBox: string;
  layers: Layer[];
  wrap?: (content: ReactNode, kind?: string) => ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  //which svg each layer was drawn in, kept for as long as this picture is up
  const [placed] = useState(() => new Map<string, string>());
  const sheets: Group[] = [];
  for (const layer of layers) {
    const last = sheets[sheets.length - 1];
    const id = placed.get(layer.key);
    if (last && (id ? last.id === id : fits(last, layer))) {
      last.layers.push(layer);
    } else {
      //its own svg again, unless that one is already in use further down, having been split
      const fresh = id && !sheets.some((sheet) => sheet.id === id) ? id : `${layer.key}#${placed.size}`;
      sheets.push({ id: fresh, layers: [layer] });
    }
    placed.set(layer.key, sheets[sheets.length - 1].id);
  }
  return (
    <div style={{ ...fill, ...style }} className={className}>
      {sheets.map((sheet) => {
        const { moving, blend, kind } = sheet.layers[0];
        const content = sheet.layers.map((layer) => <g key={layer.key}>{layer.node}</g>);
        return (
          <Sheet
            key={sheet.id}
            viewBox={viewBox}
            //something moving is its own compositing layer, so its frames don't redraw the picture under it
            style={{ ...(moving && { willChange: 'transform' }), ...(blend && { mixBlendMode: blend }) }}
          >
            {wrap ? wrap(content, kind) : content}
          </Sheet>
        );
      })}
    </div>
  );
}
