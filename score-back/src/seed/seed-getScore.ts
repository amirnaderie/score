import { DataSource } from 'typeorm';

export async function seedGetScoreProcedure(dataSource: DataSource) {
  await dataSource.query(`
    IF OBJECT_ID('getScores', 'P') IS NOT NULL
      DROP PROCEDURE getScores;
    GO
    CREATE PROCEDURE PROCEDURE getScores
	@accountNumber bigint,
	@nationalCode bigint,
	@expirationMonth int=18,
	@currentDate int=0
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
    CREATE TABLE #TempScores (
		id int,
		accountNumber bigint,
		nationalCode bigint,
		score decimal(18,2),
		updated_at datetime,
		usedScore decimal(18,2),
		gotScore decimal(18,2),
		giveScore decimal(18,2),
		usableScore decimal(18,2),
		transferableScore decimal(18,2)
	);
	
	-- Insert results from existing SP into temp table
	INSERT INTO #TempScores
	EXEC [dbo].[getValidScores] @accountNumber, @nationalCode, @expirationMonth, @currentDate;
	
	-- Calculate and return sums
	SELECT 
		SUM(usableScore) AS totalUsableScore,
		SUM(transferableScore) AS totalTransferableScore,
		COUNT(*) AS recordCount
	FROM #TempScores;
	
	-- Clean up
	DROP TABLE #TempScores;
   
END
  `);
  console.log('Seeded stored procedure: getScores');
}

// To run this seed, use a script or CLI command that imports and executes this function with your DataSource instance.
