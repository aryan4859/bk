-- existing saves start from the current price so only later drops trigger an email
UPDATE "Favorite" f SET "priceAtSave" = l."priceNpr" FROM "Listing" l WHERE l."id" = f."listingId" AND f."priceAtSave" = 0;
