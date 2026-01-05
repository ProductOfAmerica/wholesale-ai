import {
  getAllStates,
  getStateCompliance,
  getStatesWithRestrictions,
} from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const states = getAllStates();
    const statesWithRestrictions = getStatesWithRestrictions();

    const stateList = states.map((state) => {
      const compliance = getStateCompliance(state);
      return {
        code: state,
        name: compliance?.stateName ?? state,
        hasRestrictions: statesWithRestrictions.includes(state),
        rulesCount: compliance?.rules.length ?? 0,
        disclosuresCount: compliance?.disclosures.length ?? 0,
      };
    });

    return NextResponse.json({ states: stateList });
  } catch (error) {
    console.error('States list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}
