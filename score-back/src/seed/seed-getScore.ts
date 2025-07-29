import { DataSource } from 'typeorm';

export async function seedGetScoreProcedure(dataSource: DataSource) {
  await dataSource.query(`
    IF OBJECT_ID('getScores', 'P') IS NOT NULL
      DROP PROCEDURE getScores;
    GO
    CREATE PROCEDURE [dbo].[getScores] 
	@nationalCode bigint,
	@accountNumber bigint
    AS
    BEGIN
	 SET NOCOUNT ON;
	 declare @hisScoreId int
	 declare @calculated int
     declare @transferedToHim int
	 declare @transferedFromHim int
	 declare @usedByHim int

	 select @hisScoreId=id,@calculated=ISNULL(score,0) from Scores where nationalCode=@nationalCode and accountNumber=@accountNumber
	 if(@hisScoreId>0)
	   begin
	     set @transferedToHim=(select ISNULL(sum(score),0) from [dbo].[TransferScores] where toScoreId=@hisScoreId)
	 
	     set @transferedFromHim=(select ISNULL(sum(score),0) from [dbo].[TransferScores] where fromScoreId=@hisScoreId)
	
	     set @usedByHim=(select ISNULL(sum(score),0) from [dbo].[UsedScores] where scoreId=@hisScoreId)
	
	     select id=@hisScoreId,usableScore=(@calculated+@transferedToHim-@transferedFromHim-@usedByHim),transferableScore=(iif(@calculated-@transferedFromHim-@usedByHim>0,@calculated-@transferedFromHim-@usedByHim,0)),maxTransferableScore=5000
       end
	 else
	     select id=@hisScoreId,usableScore=0,transferableScore=0,maxTransferableScore=0
   END
  `);
  console.log('Seeded stored procedure: getScore');
}

// To run this seed, use a script or CLI command that imports and executes this function with your DataSource instance.
