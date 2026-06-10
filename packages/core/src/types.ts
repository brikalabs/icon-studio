import { z } from "zod";

export const hexColorSchema = z
  .string()
  .regex(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
    "expected a hex color like #3F5EFB",
  );

export const gradientStopSchema = z.object({
  color: hexColorSchema,
  /** Position along the gradient, 0 to 1. */
  offset: z.number().min(0).max(1),
});

export const solidBackgroundSchema = z.object({
  type: z.literal("solid"),
  color: hexColorSchema,
});

export const linearBackgroundSchema = z.object({
  type: z.literal("linear"),
  stops: z.array(gradientStopSchema).min(2).max(8),
  /** Degrees, CSS convention: 0 points up, 90 points right. */
  angle: z.number().min(0).max(360),
});

/** Radius (as a fraction of the canvas edge) that covers the corners from the center. */
export const COVER_RADIUS = Number(Math.SQRT1_2.toFixed(4));

export const radialBackgroundSchema = z.object({
  type: z.literal("radial"),
  stops: z.array(gradientStopSchema).min(2).max(8),
  /** Gradient center, as fractions of the canvas edge. */
  cx: z.number().min(0).max(1).default(0.5),
  cy: z.number().min(0).max(1).default(0.5),
  /** Gradient radius as a fraction of the canvas edge. */
  radius: z.number().min(0.05).max(1.5).default(COVER_RADIUS),
});

export const backgroundSchema = z.discriminatedUnion("type", [
  solidBackgroundSchema,
  linearBackgroundSchema,
  radialBackgroundSchema,
]);

export const iconLibraryIdSchema = z.enum(["lucide", "tabler", "hero", "brand", "iconify"]);
export type IconLibraryId = z.infer<typeof iconLibraryIdSchema>;

export const libraryIconSourceSchema = z.object({
  type: iconLibraryIdSchema,
  name: z.string().min(1),
});

export const customIconSourceSchema = z.object({
  type: z.literal("custom"),
  svg: z.string().min(1),
});

export const iconSourceSchema = z.union([libraryIconSourceSchema, customIconSourceSchema]);

export const iconSpecSchema = z.object({
  /** Edge length of the square canvas, in pixels. */
  canvasSize: z.number().int().min(16).max(4096).default(512),
  background: backgroundSchema.default({
    type: "linear",
    stops: [
      { color: "#3F5EFB", offset: 0 },
      { color: "#FC466B", offset: 1 },
    ],
    angle: 45,
  }),
  icon: iconSourceSchema.default({ type: "lucide", name: "bell" }),
  iconColor: hexColorSchema.default("#FFFFFF"),
  /** Icon edge length as a fraction of the canvas edge. */
  iconScale: z.number().min(0.05).max(1.5).default(0.55),
  /** Horizontal shift of the icon from center, in canvas pixels. */
  offsetX: z.number().default(0),
  /** Vertical shift of the icon from center, in canvas pixels. */
  offsetY: z.number().default(0),
  /** Icon rotation in degrees, clockwise around the icon center. */
  rotation: z.number().min(0).max(360).default(0),
  /** Lucide stroke width (24px grid units, lucide default is 2). */
  strokeWidth: z.number().min(0.25).max(6).default(2),
  /** Film-grain overlay strength over the background, 0 disables it. */
  noise: z.number().min(0).max(1).default(0),
});

export type GradientStop = z.infer<typeof gradientStopSchema>;
export type Background = z.infer<typeof backgroundSchema>;
export type LinearBackground = z.infer<typeof linearBackgroundSchema>;
export type RadialBackground = z.infer<typeof radialBackgroundSchema>;
export type IconSource = z.infer<typeof iconSourceSchema>;
export type IconSpec = z.infer<typeof iconSpecSchema>;
export type IconSpecInput = z.input<typeof iconSpecSchema>;

export function createDefaultIconSpec(): IconSpec {
  return iconSpecSchema.parse({});
}
