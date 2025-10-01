const data = localStorage.getItem('uploadedBooks');
if (data) {
  const books = JSON.parse(data);
  console.log('Uploaded books:', JSON.stringify(books.map(b => ({
    id: b.id,
    title: b.title,
    hasCover: !!b.coverUrl,
    coverUrl: b.coverUrl?.substring(0, 50) + '...'
  })), null, 2));
}
