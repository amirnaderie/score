import { DataSource } from 'typeorm';

export async function seedGetValidScoreProcedure(dataSource: DataSource) {
  await dataSource.query(`
    IF OBJECT_ID('getValidScores', 'P') IS NOT NULL
      DROP PROCEDURE getValidScores;
    GO
  CREATE PROCEDURE [dbo].[getValidScores] 
	@accountNumber bigint,
	@nationalCode bigint,
	@expirationMonth int=18,
	@currentDate int=0
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

   select S.id,s.accountNumber,s.nationalCode,s.score,s.updated_at,Us.usedScore,GOTTS.gotScore,GIVETS.giveScore,(s.score-Us.usedScore+GOTTS.gotScore-GIVETS.giveScore) as usableScore,(s.score-Us.usedScore-GIVETS.giveScore) as transferableScore from [dbo].[Scores] S
cross apply (
  select sum(score) as usedScore from [dbo].[UsedScores] where scoreId=s.id group by scoreId
) US
cross apply (
  select sum(score) as gotScore from [dbo].[TransferScores] where toScoreId=s.id group by toScoreId
) GOTTS
cross apply (
  select sum(score) as giveScore from [dbo].[TransferScores] where fromScoreId=s.id group by fromScoreId
) GIVETS
where S.accountNumber=@accountNumber and nationalCode=@nationalCode and S.updated_at>=dbo.[ShamsiToGregorian]([dbo].[SubtractMonthsFromShamsi] (iif(@currentDate=0,FORMAT(GETDATE(), 'yyyyMMdd', 'fa'),@currentDate),18))

END

  `);
  console.log('Seeded stored procedure: getValidScores');
}

// To run this seed, use a script or CLI command that imports and executes this function with your DataSource instance.
