import {
  clone,
  combine,
  ImplicitSubdivisionScheme,
  ImplicitTileset,
  MetadataSchema,
  Resource,
  RuntimeError,
} from "../../index.js";

describe("Scene/ImplicitTileset", function () {
  const contentUriPattern = "https://example.com/{level}/{x}/{y}.b3dm";
  const subtreeUriPattern = "https://example.com/{level}/{x}/{y}.subtree";
  const implicitTilingJson = {
    subdivisionScheme: "QUADTREE",
    subtreeLevels: 3,
    availableLevels: 5,
    subtrees: {
      uri: subtreeUriPattern,
    },
  };

  const implicitTilingJsonLegacy = {
    subdivisionScheme: "QUADTREE",
    subtreeLevels: 3,
    maximumLevel: 4,
    subtrees: {
      uri: subtreeUriPattern,
    },
  };

  const implicitTileJson = {
    geometricError: 500,
    refine: "ADD",
    boundingVolume: {
      region: [0, 0, Math.PI / 24, Math.PI / 24, 0, 1000.0],
    },
    content: {
      uri: contentUriPattern,
      extras: {
        author: "Cesium",
      },
    },
    implicitTiling: implicitTilingJson,
    extras: {
      creationDate: "2021-02-22",
    },
  };

  const implicitTileLegacyJson = {
    geometricError: 500,
    refine: "ADD",
    boundingVolume: {
      region: [0, 0, Math.PI / 24, Math.PI / 24, 0, 1000.0],
    },
    content: {
      uri: contentUriPattern,
      extras: {
        author: "Cesium",
      },
    },
    extensions: {
      "3DTILES_implicit_tiling": implicitTilingJsonLegacy,
    },
    extras: {
      creationDate: "2021-02-22",
    },
  };

  const baseResource = new Resource("https://example.com/tileset.json");
  const contentUriTemplate = new Resource(contentUriPattern);
  const subtreeUriTemplate = new Resource(subtreeUriPattern);

  it("gathers information from both tile JSON and extension", function () {
    let metadataSchema; // intentionally left undefined
    const implicitTileset = new ImplicitTileset(
      baseResource,
      implicitTileJson,
      metadataSchema
    );
    expect(implicitTileset.metadataSchema).toBeUndefined();
    expect(implicitTileset.subtreeLevels).toEqual(3);
    expect(implicitTileset.availableLevels).toEqual(5);
    expect(implicitTileset.subdivisionScheme).toEqual(
      ImplicitSubdivisionScheme.QUADTREE
    );
    expect(implicitTileset.boundingVolume).toEqual(
      implicitTileJson.boundingVolume
    );
    expect(implicitTileset.refine).toEqual(implicitTileJson.refine);
    expect(implicitTileset.geometricError).toEqual(500);
    expect(implicitTileset.contentUriTemplates).toEqual([contentUriTemplate]);
    expect(implicitTileset.subtreeUriTemplate).toEqual(subtreeUriTemplate);
  });

  it("stores a template of the tile JSON structure", function () {
    let metadataSchema; // intentionally left undefined
    const implicitTileset = new ImplicitTileset(
      baseResource,
      implicitTileJson,
      metadataSchema
    );
    const deep = true;
    const expected = clone(implicitTileJson, deep);
    delete expected.content;
    delete expected.implicitTiling;
    expect(implicitTileset.tileHeader).toEqual(expected);
  });

  it("tileHeader stores additional extensions", function () {
    const deep = true;
    const withExtensions = clone(implicitTileJson, deep);
    withExtensions.extensions = {};
    withExtensions.extensions["3DTILES_extension"] = {};

    let metadataSchema; // intentionally left undefined
    const implicitTileset = new ImplicitTileset(
      baseResource,
      withExtensions,
      metadataSchema
    );
    const expected = clone(withExtensions, deep);
    delete expected.content;
    delete expected.implicitTiling;
    expect(implicitTileset.tileHeader).toEqual(expected);
  });

  it("stores a template of the tile content structure", function () {
    let metadataSchema; // intentionally left undefined
    const implicitTileset = new ImplicitTileset(
      baseResource,
      implicitTileJson,
      metadataSchema
    );
    expect(implicitTileset.contentHeaders[0]).toEqual(implicitTileJson.content);
  });

  it("allows undefined content URI", function () {
    const noContentJson = clone(implicitTileJson);
    delete noContentJson.content;
    let metadataSchema; // intentionally left undefined
    const implicitTileset = new ImplicitTileset(
      baseResource,
      noContentJson,
      metadataSchema
    );
    expect(implicitTileset.contentUriTemplates).toEqual([]);
  });

  it("accepts tilesets with 3DTILES_bounding_volume_S2", function () {
    const tileJson = clone(implicitTileLegacyJson, true);
    tileJson.boundingVolume = {
      extensions: {
        "3DTILES_bounding_volume_S2": {
          token: "1",
          minimumHeight: 0,
          maximumHeight: 100,
        },
      },
    };
    const tileJsonS2 =
      tileJson.boundingVolume.extensions["3DTILES_bounding_volume_S2"];

    let metadataSchema;
    const implicitTileset = new ImplicitTileset(
      baseResource,
      tileJson,
      metadataSchema
    );
    const implicitTilesetS2 =
      implicitTileset.boundingVolume.extensions["3DTILES_bounding_volume_S2"];
    expect(implicitTilesetS2.token).toEqual(tileJsonS2.token);
    expect(implicitTilesetS2.minimumHeight).toEqual(tileJsonS2.minimumHeight);
    expect(implicitTilesetS2.maximumHeight).toEqual(tileJsonS2.maximumHeight);
  });

  it("rejects bounding spheres", function () {
    const sphereJson = {
      boundingVolume: {
        sphere: [0, 0, 0, 100],
      },
    };
    const tileJson = combine(sphereJson, implicitTileJson);
    let metadataSchema; // intentionally left undefined
    expect(function () {
      return new ImplicitTileset(baseResource, tileJson, metadataSchema);
    }).toThrowError(RuntimeError);
  });

  describe("3DTILES_implicit_tiling", function () {
    it("gathers information from both tile JSON and extension (legacy)", function () {
      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        implicitTileLegacyJson,
        metadataSchema
      );
      expect(implicitTileset.metadataSchema).toBeUndefined();
      expect(implicitTileset.subtreeLevels).toEqual(3);
      expect(implicitTileset.availableLevels).toEqual(5);
      expect(implicitTileset.subdivisionScheme).toEqual(
        ImplicitSubdivisionScheme.QUADTREE
      );
      expect(implicitTileset.boundingVolume).toEqual(
        implicitTileJson.boundingVolume
      );
      expect(implicitTileset.refine).toEqual(implicitTileJson.refine);
      expect(implicitTileset.geometricError).toEqual(500);
      expect(implicitTileset.contentUriTemplates).toEqual([contentUriTemplate]);
      expect(implicitTileset.subtreeUriTemplate).toEqual(subtreeUriTemplate);
    });

    it("supports maximumLevel parameter in tile JSON (legacy)", function () {
      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        implicitTileLegacyJson,
        metadataSchema
      );
      expect(implicitTileset.availableLevels).toEqual(5);
    });

    it("stores a template of the tile JSON structure (legacy)", function () {
      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        implicitTileLegacyJson,
        metadataSchema
      );
      const deep = true;
      const expected = clone(implicitTileLegacyJson, deep);
      delete expected.content;
      delete expected.extensions;
      expect(implicitTileset.tileHeader).toEqual(expected);
    });

    it("tileHeader stores additional extensions (legacy)", function () {
      const deep = true;
      const withExtensions = clone(implicitTileLegacyJson, deep);
      withExtensions.extensions["3DTILES_extension"] = {};

      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        withExtensions,
        metadataSchema
      );
      const expected = clone(withExtensions, deep);
      delete expected.content;
      delete expected.extensions["3DTILES_implicit_tiling"];
      expect(implicitTileset.tileHeader).toEqual(expected);
    });

    it("stores a template of the tile content structure (legacy)", function () {
      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        implicitTileLegacyJson,
        metadataSchema
      );
      expect(implicitTileset.contentHeaders[0]).toEqual(
        implicitTileJson.content
      );
    });

    it("allows undefined content URI (legacy)", function () {
      const noContentJson = clone(implicitTileLegacyJson);
      delete noContentJson.content;
      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        noContentJson,
        metadataSchema
      );
      expect(implicitTileset.contentUriTemplates).toEqual([]);
    });

    it("rejects bounding spheres (legacy)", function () {
      const sphereJson = {
        boundingVolume: {
          sphere: [0, 0, 0, 100],
        },
      };
      const tileJson = combine(sphereJson, implicitTileLegacyJson);
      let metadataSchema; // intentionally left undefined
      expect(function () {
        return new ImplicitTileset(baseResource, tileJson, metadataSchema);
      }).toThrowError(RuntimeError);
    });
  });

  const b3dmPattern = "https://example.com/{level}/{x}/{y}.b3dm";
  const pntsPattern = "https://example.com/{level}/{x}/{y}.pnts";
  const gltfPattern = "https://example.com/{level}/{x}/{y}.gltf";

  describe("multiple contents", function () {
    const multipleContentTile = {
      geometricError: 500,
      refine: "ADD",
      boundingVolume: {
        region: [0, 0, Math.PI / 24, Math.PI / 24, 0, 1000.0],
      },
      implicitTiling: {
        subdivisionScheme: "QUADTREE",
        subtreeLevels: 3,
        availableLevels: 5,
        subtrees: {
          uri: subtreeUriPattern,
        },
      },
      contents: [
        {
          uri: b3dmPattern,
        },
        {
          uri: pntsPattern,
        },
        {
          uri: gltfPattern,
        },
      ],
    };

    it("gathers content URIs from contents array", function () {
      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        multipleContentTile,
        metadataSchema
      );
      expect(implicitTileset.contentUriTemplates).toEqual([
        new Resource({ url: b3dmPattern }),
        new Resource({ url: pntsPattern }),
        new Resource({ url: gltfPattern }),
      ]);
    });

    it("stores content JSON for every tile", function () {
      const deep = true;
      const withProperties = clone(multipleContentTile, deep);
      const extension = { "3DTILES_extension": {} };
      const boundingBox = { box: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] };
      const contents = withProperties.contents;
      let i;
      for (i = 0; i < contents.length; i++) {
        contents[i].boundingVolume = boundingBox;
        contents[i].extensions = extension;
      }

      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        withProperties,
        metadataSchema
      );
      for (i = 0; i < implicitTileset.contentHeaders.length; i++) {
        expect(implicitTileset.contentHeaders[i]).toEqual(contents[i]);
      }
    });

    it("template tileHeader does not store multiple contents extension", function () {
      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        multipleContentTile,
        metadataSchema
      );
      expect(implicitTileset.tileHeader.extensions).not.toBeDefined();
    });
  });

  describe("3DTILES_multiple_contents", function () {
    const multipleContentLegacyTile = {
      geometricError: 500,
      refine: "ADD",
      boundingVolume: {
        region: [0, 0, Math.PI / 24, Math.PI / 24, 0, 1000.0],
      },
      extensions: {
        "3DTILES_implicit_tiling": {
          subdivisionScheme: "QUADTREE",
          subtreeLevels: 3,
          availableLevels: 5,
          subtrees: {
            uri: subtreeUriPattern,
          },
        },
        "3DTILES_multiple_contents": {
          contents: [
            {
              uri: b3dmPattern,
            },
            {
              uri: pntsPattern,
            },
            {
              uri: gltfPattern,
            },
          ],
        },
      },
    };

    it("gathers content URIs from multiple contents extension (legacy)", function () {
      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        multipleContentLegacyTile,
        metadataSchema
      );
      expect(implicitTileset.contentUriTemplates).toEqual([
        new Resource({ url: b3dmPattern }),
        new Resource({ url: pntsPattern }),
        new Resource({ url: gltfPattern }),
      ]);
    });

    it("stores content JSON for every tile (legacy)", function () {
      const deep = true;
      const withProperties = clone(multipleContentLegacyTile, deep);
      const extension = { "3DTILES_extension": {} };
      const boundingBox = { box: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] };
      const contents =
        withProperties.extensions["3DTILES_multiple_contents"].contents;
      let i;
      for (i = 0; i < contents.length; i++) {
        contents[i].boundingVolume = boundingBox;
        contents[i].extensions = extension;
      }

      let metadataSchema; // intentionally left undefined
      const implicitTileset = new ImplicitTileset(
        baseResource,
        withProperties,
        metadataSchema
      );
      for (i = 0; i < implicitTileset.contentHeaders.length; i++) {
        expect(implicitTileset.contentHeaders[i]).toEqual(contents[i]);
      }
    });
  });

  describe("metadata", function () {
    it("stores metadataSchema", function () {
      const schema = {
        classes: {
          tile: {
            properties: {
              buildingCount: {
                type: "SCALAR",
                componentType: "UINT16",
              },
            },
          },
        },
      };

      const metadataSchema = new MetadataSchema(schema);

      const implicitTileset = new ImplicitTileset(
        baseResource,
        implicitTileJson,
        metadataSchema
      );

      expect(implicitTileset.metadataSchema).toBeDefined();
      expect(implicitTileset.metadataSchema.classes.tile).toBeDefined();
    });
  });
});
