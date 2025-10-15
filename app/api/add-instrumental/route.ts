import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { taskId, prompt } = await request.json();

  if (!taskId || !prompt) {
    return NextResponse.json({ error: 'Task ID and prompt are required' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.sunoapi.org/api/v1/add-instrumental', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUNOAPI_ORG || ''}`,
      },
      body: JSON.stringify({ taskId, prompt }),
    });

    const data = await response.json();

    if (data.code !== 200) {
      console.error('Suno API error:', data);
      return NextResponse.json(
        { error: data.msg || 'Failed to add instrumental' },
        { status: 500 }
      );
    }

    return NextResponse.json({ taskId: data.data.taskId });
  } catch (error) {
    console.error('Add instrumental error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
