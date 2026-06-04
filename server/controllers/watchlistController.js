import { Portfolio } from '../models/Portfolio.js';
import { SavedCoin } from '../models/SavedCoin.js';
import { Watchlist } from '../models/Watchlist.js';
import { ApiError } from '../utils/apiError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getMarkets } from '../services/cryptoService.js';

async function populateWatchlistPrices(watchlist) {
  if (!watchlist) return watchlist;
  
  // Handle mongoose document conversion if needed
  const listObj = watchlist.toObject ? watchlist.toObject() : watchlist;
  const coins = listObj.coins || [];

  if (coins.length === 0) {
    return listObj;
  }

  try {
    const market = await getMarkets(250);
    listObj.coins = coins.map((coin) => {
      const match = market.find((m) => m.id === coin.coinId);
      return {
        ...coin,
        currentPrice: match?.currentPrice || 0,
        change24h: match?.change24h || 0,
        sparkline: match?.sparkline || [],
      };
    });
  } catch (error) {
    console.error('Failed to populate watchlist prices:', error);
  }
  return listObj;
}

export async function getUserWatchlists(req, res) {
  const watchlists = await Watchlist.find({ userId: req.params.userId }).lean();
  const populated = await Promise.all(watchlists.map(populateWatchlistPrices));
  sendResponse(res, 200, 'Watchlists fetched successfully.', populated);
}

export async function createWatchlist(req, res) {
  const watchlist = await Watchlist.create({ ...req.body, userId: req.params.userId });
  const populated = await populateWatchlistPrices(watchlist);
  sendResponse(res, 201, 'Watchlist created successfully.', populated);
}

export async function updateWatchlist(req, res) {
  const watchlist = await Watchlist.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });

  if (!watchlist) {
    throw new ApiError(404, 'Watchlist not found.');
  }

  const populated = await populateWatchlistPrices(watchlist);
  sendResponse(res, 200, 'Watchlist updated successfully.', populated);
}

export async function addToWatchlist(req, res) {
  const userId = req.user?._id;
  const { coinId, symbol, name, image } = req.body;

  if (!userId || !coinId) {
    throw new ApiError(400, 'coinId is required.');
  }

  const watchlist = await Watchlist.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: { userId, name: 'Default Watchlist' },
      $addToSet: { coins: { coinId, symbol, name, image } },
    },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );

  await SavedCoin.findOneAndUpdate(
    { userId, coinId },
    { userId, coinId, symbol, name, image },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );

  const populated = await populateWatchlistPrices(watchlist);
  sendResponse(res, 201, 'Coin added to watchlist.', populated);
}

export async function removeFromWatchlist(req, res) {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, 'Authenticated user is required.');
  }

  const watchlist = await Watchlist.findOneAndUpdate(
    { userId },
    { $pull: { coins: { coinId: req.params.coinId } } },
    { returnDocument: 'after' }
  );

  await SavedCoin.deleteOne({ userId, coinId: req.params.coinId });

  const populated = await populateWatchlistPrices(watchlist || { userId, coins: [] });
  sendResponse(res, 200, 'Coin removed from watchlist.', populated);
}

export async function getCurrentWatchlist(req, res) {
  const userId = String(req.user?._id);
  if (!userId) {
    throw new ApiError(403, 'User not authenticated.');
  }

  const watchlist = await Watchlist.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, name: 'Default Watchlist' } },
    { upsert: true, returnDocument: 'after' },
  ).lean();

  const populated = await populateWatchlistPrices(watchlist);
  sendResponse(res, 200, 'Watchlist fetched successfully.', populated);
}

export async function getWatchlistByUser(req, res) {
  const authenticatedUserId = String(req.user?._id);
  const requestedUserId = req.params.userId;

  if (!requestedUserId || requestedUserId !== authenticatedUserId) {
    throw new ApiError(403, 'Access denied. You can only fetch your own watchlist.');
  }

  const watchlists = await Watchlist.find({ userId: authenticatedUserId }).lean();
  const populated = await Promise.all(watchlists.map(populateWatchlistPrices));
  sendResponse(res, 200, 'Watchlist fetched successfully.', populated);
}

export async function getPortfolio(req, res) {
  const portfolio = await Portfolio.findOneAndUpdate(
    { userId: req.params.userId },
    { $setOnInsert: { userId: req.params.userId, holdings: [] } },
    { upsert: true, returnDocument: 'after' },
  );
  sendResponse(res, 200, 'Portfolio fetched.', portfolio);
}

export async function updatePortfolio(req, res) {
  const portfolio = await Portfolio.findOneAndUpdate(
    { userId: req.params.userId },
    { ...req.body, userId: req.params.userId },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );
  sendResponse(res, 200, 'Portfolio updated.', portfolio);
}

export async function getSavedCoins(req, res) {
  const savedCoins = await SavedCoin.find({ userId: req.params.userId }).lean();
  sendResponse(res, 200, 'Saved coins fetched.', savedCoins);
}

export async function saveCoin(req, res) {
  const savedCoin = await SavedCoin.findOneAndUpdate(
    { userId: req.params.userId, coinId: req.body.coinId },
    { ...req.body, userId: req.params.userId },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );
  sendResponse(res, 201, 'Coin saved.', savedCoin);
}

export async function deleteSavedCoin(req, res) {
  await SavedCoin.deleteOne({ userId: req.params.userId, coinId: req.params.coinId });
  res.status(204).end();
}
