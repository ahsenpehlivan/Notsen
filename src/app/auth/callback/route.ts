import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function parseRequestCookies(request: Request) {
  const header = request.headers.get('cookie');
  if (!header) return [];
  return header.split('; ').map((cookie) => {
    const [name, ...rest] = cookie.split('=');
    return { name, value: rest.join('=') };
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/boards';

  if (!code) {
    return NextResponse.redirect(new URL('/boards', request.url));
  }

  const response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseRequestCookies(request);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth', request.url));
  }

  return response;
}
