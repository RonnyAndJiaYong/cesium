function getRecBypoint(center, width, height) {
  const centerCartographic = Cesium.Cartographic.fromCartesian(center);

  // 获取中心点的经度和纬度
  const centerLongitude = Cesium.Math.toDegrees(centerCartographic.longitude);
  const centerLatitude = Cesium.Math.toDegrees(centerCartographic.latitude);

  // 计算矩形四个角的经纬度
  const southWestLongitude =
    centerLongitude -
    width / 2.0 / 111319.9 / Math.cos((centerLatitude * Math.PI) / 180.0);
  const southWestLatitude = centerLatitude - height / 2.0 / 111319.9;
  const northEastLongitude =
    centerLongitude +
    width / 2.0 / 111319.9 / Math.cos((centerLatitude * Math.PI) / 180.0);
  const northEastLatitude = centerLatitude + height / 2.0 / 111319.9;

  // 创建矩形实体
  const rectangle = Cesium.Rectangle.fromDegrees(
    southWestLongitude,
    southWestLatitude,
    northEastLongitude,
    northEastLatitude
  );
  return rectangle;
}
