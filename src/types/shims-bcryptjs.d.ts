// Minimal type shim for bcryptjs if @types/bcryptjs is not installed
declare module 'bcryptjs' {
  export function hashSync(data: string, saltOrRounds?: string | number): string;
  export function compareSync(data: string, encrypted: string): boolean;
}
