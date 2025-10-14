import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Checking credits...');
  console.log('SUNOAPI_ORG:', process.env.SUNOAPI_ORG);

  try {
    const response = await fetch('https://api.sunoapi.org/api/v1/generate/credit', {
      headers: {
        'Authorization': `Bearer ${process.env.SUNOAPI_ORG || ''}`,
      },
    });

    const data = await response.json();
    console.log('Suno API response:', data);

    if (data.code !== 200) {
      return NextResponse.json(
        { error: data.msg || 'Failed to get credits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ credits: data.data });

  } catch (error) {
    console.error('Credits check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
