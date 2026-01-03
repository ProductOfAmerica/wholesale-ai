export function validateEnv<T extends readonly string[]>(
  required: T,
  env: Record<string, string | undefined> = process.env
): { [K in T[number]]: string } {
  const missing: string[] = [];
  const result: Record<string, string> = {};

  for (const key of required) {
    const value = env[key];
    if (!value) {
      missing.push(key);
    } else {
      result[key] = value;
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:\n');
    for (const key of missing) {
      console.error(`   - ${key}`);
    }
    console.error('\nPlease set these in your .env.local file.\n');
    process.exit(1);
  }

  return result as { [K in T[number]]: string };
}
