/**
 * lucide-static ships untyped JSON; typing happens at runtime through the
 * zod schemas in lucide.ts. Declaring the modules as `unknown` keeps tsc
 * from inferring a megabyte-sized literal type out of the JSON files.
 */
declare module "lucide-static/icon-nodes.json" {
  const iconNodes: unknown;
  export default iconNodes;
}

declare module "lucide-static/tags.json" {
  const tags: unknown;
  export default tags;
}
