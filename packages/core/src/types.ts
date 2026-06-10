import { z } from "zod";

export const hexColorSchema = z
  .string()
  .regex(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
    "expected a hex color like #3F5EFB",
  );

export const solidBackgroundSchema = z.object({
  type: z.literal("solid"),
  color: hexColorSchema,
});

export const linearBackgroundSchema = z.object({
  type: z.literal("linear"),
  from: hexColorSchema,
  to: hexColorSchema,
  /** Degrees, CSS convention: 0 points up, 90 points right. */
  angle: z.number().min(0).max(360),
});

export const radialBackgroundSchema = z.object({
  type: z.literal("radial"),
  from: hexColorSchema,
  to: hexColorSchema,
});

export const backgroundSchema = z.discriminatedUnion("type", [
  solidBackgroundSchema,
  linearBackgroundSchema,
  radialBackgroundSchema,
]);

export const lucideIconSourceSchema = z.object({
  type: z.literal("lucide"),
  name: z.string().min(1),
});

export const customIconSourceSchema = z.object({
  type: z.literal("custom"),
  svg: z.string().min(1),
});

export const iconSourceSchema = z.discriminatedUnion("type", [
  lucideIconSourceSchema,
  customIconSourceSchema,
]);

export const iconSpecSchema = z.object({
  /** Edge length of the square canvas, in pixels. */
  canvasSize: z.number().int().min(16).max(4096).default(512),
  background: backgroundSchema.default({
    type: "linear",
    from: "#3F5EFB",
    to: "#FC466B",
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
  /** Lucide stroke width (24px grid units, lucide default is 2). */
  strokeWidth: z.number().min(0.25).max(6).default(2),
});

export type Background = z.infer<typeof backgroundSchema>;
export type IconSource = z.infer<typeof iconSourceSchema>;
export type IconSpec = z.infer<typeof iconSpecSchema>;
export type IconSpecInput = z.input<typeof iconSpecSchema>;

export function createDefaultIconSpec(): IconSpec {
  return iconSpecSchema.parse({});
}
