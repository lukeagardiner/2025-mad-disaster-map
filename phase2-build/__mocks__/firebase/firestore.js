module.exports = {
    getFirestore: jest.fn(),
    collection: jest.fn(),
    getDocs: jest.fn().mockResolvedValue({
      forEach: jest.fn(), // Simulate no docs
    }),
    query: jest.fn(),
    where: jest.fn(),
  };