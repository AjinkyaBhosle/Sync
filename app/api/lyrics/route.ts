import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.sunoapi.org/api/v1/generate/lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUNOAPI_ORG || ''}`,
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    const data = await response.json();

    if (data.code !== 200) {
      console.error('Suno API error:', data);
      return NextResponse.json(
        { error: data.msg || 'Failed to generate lyrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.data.id, title: data.data.title, lyrics: data.data.lyrics });
  } catch (error) {
    console.error('Lyrics generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
