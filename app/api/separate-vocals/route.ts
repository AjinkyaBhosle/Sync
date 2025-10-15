import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { taskId } = await request.json();

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.sunoapi.org/api/v1/separate-vocals', {
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
        { error: data.msg || 'Failed to separate vocals' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vocalUrl: data.data.vocalUrl, instrumentalUrl: data.data.instrumentalUrl });
  } catch (error) {
    console.error('Separate vocals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
