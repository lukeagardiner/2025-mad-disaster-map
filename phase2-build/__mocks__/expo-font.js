module.exports = {
    loadAsync: jest.fn(),
    isLoaded: jest.fn().mockReturnValue(true),
    Font: { processFontFamily: jest.fn() },
  };