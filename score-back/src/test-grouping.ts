async function testGrouping() {
  try {
    // This is a simplified test to verify the grouping logic
    console.log('Testing grouping logic...');
    
    // Sample data that would be returned from the database
    const sampleData = [
      { referenceCode: 1001, accountNumber: 123456, score: 100, updatedAt: new Date('2023-01-01') },
      { referenceCode: 1001, accountNumber: 123456, score: 50, updatedAt: new Date('2023-01-02') },
      { referenceCode: 1002, accountNumber: 123457, score: 200, updatedAt: new Date('2023-01-03') },
      { referenceCode: 1002, accountNumber: 123457, score: 75, updatedAt: new Date('2023-01-04') },
      { referenceCode: 1003, accountNumber: 123458, score: 300, updatedAt: new Date('2023-01-05') }
    ];
    
    // Group by referenceCode and sum scores
    const groupedData = sampleData.reduce((acc, item) => {
      if (!acc[item.referenceCode]) {
        acc[item.referenceCode] = {
          referenceCode: item.referenceCode,
          accountNumber: item.accountNumber,
          totalScore: 0,
          latestUpdatedAt: new Date(0)
        };
      }
      
      acc[item.referenceCode].totalScore += item.score;
      if (item.updatedAt > acc[item.referenceCode].latestUpdatedAt) {
        acc[item.referenceCode].latestUpdatedAt = item.updatedAt;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by latestUpdatedAt
    const result = Object.values(groupedData)
      .sort((a: any, b: any) => b.latestUpdatedAt.getTime() - a.latestUpdatedAt.getTime());
    
    console.log('Grouped result:', result);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGrouping();