/**
 * RLS Smoke Tests - Test Row Level Security policies
 * 
 * Usage: Run these in browser console to verify RLS is working
 * Make sure you're logged out (anonymous) when testing restrictions
 */

// DEPRECATED: RLS smoke tests not needed with AWS RDS
// This file is kept for reference but functionality is disabled

// Test 1: Anonymous users should NOT be able to access sensitive tables
export const testAnonRestrictions = async () => {
  console.log('🔒 Testing anonymous access restrictions...');
  
  const tests = [
    {
      name: 'Business partners (should be restricted)',
      test: () => supabase.from('business_partners').select('id').limit(1)
    },
    {
      name: 'Business profiles (should be restricted)', 
      test: () => supabase.from('business_profiles').select('id').limit(1)
    },
    {
      name: 'Lead events (should be restricted)',
      test: () => supabase.from('lead_events').select('id').limit(1)
    },
  ];

  for (const { name, test } of tests) {
    try {
      const { data, error } = await test();
      
      if (error) {
        console.log(`✅ ${name}: BLOCKED (${error.message})`);
      } else {
        console.warn(`⚠️  ${name}: ACCESSIBLE (${data?.length || 0} rows)`);
      }
    } catch (err) {
      console.log(`✅ ${name}: BLOCKED (exception)`);
    }
  }
};

// Test 2: Anonymous users SHOULD be able to access public tables
export const testAnonAllowed = async () => {
  console.log('🌐 Testing anonymous access to public tables...');
  
  const tests = [
    {
      name: 'GMB categories (should be accessible)',
      test: () => supabase.from('gmb_categories').select('id').limit(1)
    },
    {
      name: 'Visibility check leads (should be accessible for creation)',
      test: () => supabase.from('visibility_check_leads').select('id').limit(1)
    },
    {
      name: 'Unclaimed profiles (should be readable)',
      test: () => supabase.from('unclaimed_business_profiles').select('id').limit(1)
    },
  ];

  for (const { name, test } of tests) {
    try {
      const { data, error } = await test();
      
      if (error) {
        console.warn(`⚠️  ${name}: BLOCKED (${error.message})`);
      } else {
        console.log(`✅ ${name}: ACCESSIBLE (${data?.length || 0} rows found)`);
      }
    } catch (err) {
      console.warn(`⚠️  ${name}: ERROR (${err})`);
    }
  }
};

// Test 3: Test claiming functionality (requires login)
export const testClaimFlow = async () => {
  console.log('🏷️  Testing claim flow (requires authenticated user)...');
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.warn('⚠️  No authenticated user - skipping claim tests');
    return;
  }

  try {
    // Try to find an unclaimed profile
    const { data: profiles, error: fetchError } = await supabase
      .from('unclaimed_business_profiles')
      .select('id, claim_status, claimed_by_user_id')
      .eq('claim_status', 'unclaimed')
      .is('claimed_by_user_id', null)
      .limit(1);

    if (fetchError) {
      console.warn(`⚠️  Could not fetch unclaimed profiles: ${fetchError.message}`);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('ℹ️  No unclaimed profiles available for testing');
      return;
    }

    const testProfile = profiles[0];
    console.log(`🎯 Testing claim on profile: ${testProfile.id}`);

    // Attempt to claim
    const { data, error } = await supabase
      .from('unclaimed_business_profiles')
      .update({
        claim_status: 'claimed',
        claimed_by_user_id: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', testProfile.id)
      .eq('claim_status', 'unclaimed')
      .is('claimed_by_user_id', null)
      .select()
      .single();

    if (error) {
      console.log(`✅ Claim properly restricted: ${error.message}`);
    } else {
      console.log(`✅ Claim successful for user ${user.id}`);
      
      // Test duplicate claim (should fail)
      const { error: dupError } = await supabase
        .from('unclaimed_business_profiles')
        .update({
          claim_status: 'claimed',
          claimed_by_user_id: 'different-user-id',
          claimed_at: new Date().toISOString(),
        })
        .eq('id', testProfile.id);

      if (dupError) {
        console.log(`✅ Duplicate claim properly blocked: ${dupError.message}`);
      } else {
        console.warn(`⚠️  Duplicate claim was allowed - RLS issue!`);
      }
    }
  } catch (err) {
    console.warn(`⚠️  Claim test error: ${err}`);
  }
};

// Test 4: Test category cross-tags join (should work with FK)
export const testCategoryJoins = async () => {
  console.log('🔗 Testing category cross-tags FK joins...');
  
  try {
    const { data, error } = await supabase
      .from('gmb_categories')
      .select(`
        id,
        name_de,
        category_cross_tags!inner(
          target_main_category_id,
          confidence_score,
          source
        )
      `)
      .limit(3);

    if (error) {
      console.warn(`⚠️  Cross-tags join failed: ${error.message}`);
    } else {
      console.log(`✅ Cross-tags join working: ${data?.length || 0} categories with cross-tags`);
      if (data && data.length > 0) {
        const sample = data[0];
        console.log(`   Sample: ${sample.name_de} has ${sample.category_cross_tags?.length || 0} cross-tags`);
      }
    }
  } catch (err) {
    console.warn(`⚠️  Cross-tags join error: ${err}`);
  }
};

// Run all tests
export const runAllSmokeTests = async () => {
  console.log('🧪 Starting RLS Smoke Tests...\n');
  
  await testAnonRestrictions();
  console.log('');
  
  await testAnonAllowed();
  console.log('');
  
  await testClaimFlow();
  console.log('');
  
  await testCategoryJoins();
  
  console.log('\n🏁 RLS Smoke Tests Complete!');
  console.log('💡 Check above for any ⚠️  warnings that need attention');
};

// Browser console helper
if (typeof window !== 'undefined') {
  // @ts-ignore - for browser console use
  window.rlsTests = {
    runAll: runAllSmokeTests,
    testAnon: testAnonRestrictions,
    testPublic: testAnonAllowed,
    testClaim: testClaimFlow,
    testJoins: testCategoryJoins,
  };
  
  console.log('🧪 RLS Tests available in console:');
  console.log('   window.rlsTests.runAll() - Run all tests');
  console.log('   window.rlsTests.testAnon() - Test restrictions');
  console.log('   window.rlsTests.testPublic() - Test public access');
  console.log('   window.rlsTests.testClaim() - Test claim flow');
  console.log('   window.rlsTests.testJoins() - Test FK joins');
}