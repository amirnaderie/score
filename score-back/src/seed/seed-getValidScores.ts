import { DataSource } from 'typeorm';

export async function seedGetValidScoreProcedure(dataSource: DataSource) {
  await dataSource.query(`
    IF OBJECT_ID('getValidScores', 'P') IS NOT NULL
      DROP PROCEDURE getValidScores;
    GO
  ALTER   FUNCTION [dbo].[getScoresFunction]
(
    @accountNumber BIGINT,
    @nationalCode BIGINT,
    @expirationMonth INT = 18,
    @currentDate INT = 0
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        MAX(accountNumber) as accountNumber,
        MAX(nationalCode) as nationalCode,
        SUM(usableScore) AS usableScore,
        SUM(transferableScore) AS transferableScore,
        COUNT(*) AS recordCount,
		max(updated_at) as updated_at
    FROM dbo.getValidScoresFunction(@accountNumber, @nationalCode, @expirationMonth, @currentDate)
);

create FUNCTION [dbo].[getValidScoresFunction]
(
    @accountNumber BIGINT,
    @nationalCode BIGINT,
    @expirationMonth INT = 18,
    @currentDate INT = 0
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        S.id,
        S.accountNumber,
        S.nationalCode,
        S.score,
        S.updated_at,
        ISNULL(Us.usedScore, 0) as usedScore,
        ISNULL(GOTTS.gotScore, 0) as gotScore,
        ISNULL(GIVETS.giveScore, 0) as giveScore,
        (S.score - ISNULL(Us.usedScore, 0) + ISNULL(GOTTS.gotScore, 0) - ISNULL(GIVETS.giveScore, 0)) as usableScore,
        (S.score - ISNULL(Us.usedScore, 0) - ISNULL(GIVETS.giveScore, 0)) as transferableScore
    FROM [dbo].[Scores] S
    OUTER APPLY (
        SELECT SUM(score) as usedScore 
        FROM [dbo].[UsedScores] 
        WHERE scoreId = S.id 
        GROUP BY scoreId
    ) US
    OUTER APPLY (
        SELECT SUM(score) as gotScore 
        FROM [dbo].[TransferScores] 
        WHERE toScoreId = S.id 
        GROUP BY toScoreId
    ) GOTTS
    OUTER APPLY (
        SELECT SUM(score) as giveScore 
        FROM [dbo].[TransferScores] 
        WHERE fromScoreId = S.id 
        GROUP BY fromScoreId
    ) GIVETS
    WHERE S.accountNumber = @accountNumber 
      AND S.nationalCode = @nationalCode 
      AND S.updated_at >= dbo.[ShamsiToGregorian](
          [dbo].[SubtractMonthsFromShamsi](
              IIF(@currentDate = 0, FORMAT(GETDATE(), 'yyyyMMdd', 'fa'), @currentDate), 
              @expirationMonth
          )
      )
	 
);

ALTER PROCEDURE [dbo].[getScoresOfNationalCode]
    @nationalCode BIGINT,
    @expirationMonth INT = 18,
    @currentDate INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        f.accountNumber,
        f.nationalCode,
        f.usableScore,
        f.transferableScore,
        f.recordCount,
		f.updated_at
    FROM (
        SELECT DISTINCT accountNumber
        FROM [dbo].[Scores]
        WHERE nationalCode = @nationalCode
    ) accounts
    CROSS APPLY dbo.getScoresFunction(accounts.accountNumber, @nationalCode, @expirationMonth, @currentDate) f
    WHERE f.recordCount > 0; -- Only return accounts that have valid scores
END;

  `);
  console.log('Seeded stored procedure: getValidScores');
}

// To run this seed, use a script or CLI command that imports and executes this function with your DataSource instance.
