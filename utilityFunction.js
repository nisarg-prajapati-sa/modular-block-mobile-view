function getMobileView(orderKey, data) {
  let order;
  for (const key in data) {
    if (data[key].referenceUid == orderKey) order = data[key]?.data;
  }
  //console.log(order);
  const unorderedArray = data[orderKey] || [];

  // Create a map of uids to items for fast lookup
  const uidToItemMap = {};
  unorderedArray.forEach((item) => {
    const uid = item[Object.keys(item)[0]]._metadata.uid;
    uidToItemMap[uid] = item;
  });

  // Reorder the array based on the order specified and hidden
  const orderedArray = order
    .map((obj) => {
      const key = Object.keys(obj)[0]; // Extract the key from the object
      const item = uidToItemMap[obj[key].uid]; // Get the item from uidToItemMap
      return item && !obj[key].hidden ? item : null; // Return the item only if it's not hidden
    })
    .filter((item) => item); // Filter out any falsy values
  return orderedArray;
}

// Usage
// const mobileView = getMobileView("page_components", entry);
// console.log(mobileView);
