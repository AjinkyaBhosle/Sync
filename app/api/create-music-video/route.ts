import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { taskId } = await request.json();

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.sunoapi.org/api/v1/create-music-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUNOAPI_ORG || ''}`,
      },
      body: JSON.stringify({ taskId }),
    });

    const data = await response.json();

    if (data.code !== 200) {
      console.error('Suno API error:', data);
      return NextResponse.json(
        { error: data.msg || 'Failed to create music video' },
        { status: 500 }
      );
    }

    return NextResponse.json({ videoUrl: data.data.videoUrl });
  } catch (error) {
    console.error('Create music video error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
