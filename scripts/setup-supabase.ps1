param(
  [Parameter(Mandatory = $true)]
  [string]$SupabaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$SupabaseAnonKey
)

$envContent = @"
NEXT_PUBLIC_SUPABASE_URL=$SupabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SupabaseAnonKey
"@

Set-Content -Path ".env.local" -Value $envContent -Encoding utf8

Write-Host "Created .env.local"
Write-Host "Next steps:"
Write-Host "1) Run supabase/migrations/001_init.sql in Supabase SQL Editor"
Write-Host "2) Set Auth redirect URL to http://localhost:3000/auth/callback"
Write-Host "3) npm run dev"
