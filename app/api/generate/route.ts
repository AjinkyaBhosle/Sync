import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt } = await request.json();
  
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  // Validate prompt length for non-custom mode (max 500 characters per API docs)
  if (prompt.length > 500) {
    return NextResponse.json({ 
      error: 'Prompt must be 500 characters or less for non-custom mode' 
    }, { status: 400 });
  }

  try {
    // Construct callback URL - use the request origin
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000';
    const callbackUrl = `${origin}/api/callback`;
    
    console.log('Initiating music generation with callback:', callbackUrl);
    
    // Generate music using Suno API
    const generateResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUNOAPI_ORG || ''}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        customMode: false,
        instrumental: false,
        model: 'V5',
        callBackUrl: callbackUrl,
      }),
    });

    const generateData = await generateResponse.json();
    
    // Check if the API returned an error
    if (generateData.code !== 200) {
      console.error('Suno API error:', generateData);
      return NextResponse.json(
        { error: generateData.msg || 'Failed to generate song' }, 
        { status: 500 }
      );
    }

    const taskId = generateData.data?.taskId;
    
    if (!taskId) {
      return NextResponse.json({ error: 'No task ID returned' }, { status: 500 });
    }

    // Return task ID immediately so frontend can poll for progress
    return NextResponse.json({ taskId });
    
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}