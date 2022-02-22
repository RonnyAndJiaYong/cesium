import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import PropertyTable from "./PropertyTable.js";
import PropertyTexture from "./PropertyTexture.js";
import StructuralMetadata from "./StructuralMetadata.js";
import MetadataTable from "./MetadataTable.js";

/**
 * Parse the <code>EXT_structural_metadata</code> glTF extension to create a
 * structural metadata object.
 *
 * @param {Object} options Object with the following properties:
 * @param {Object} options.extension The extension JSON object.
 * @param {MetadataSchema} options.schema The parsed schema.
 * @param {Object.<String, Uint8Array>} [options.bufferViews] An object mapping bufferView IDs to Uint8Array objects.
 * @param {Object.<String, Texture>} [options.textures] An object mapping texture IDs to {@link Texture} objects.
 * @return {StructuralMetadata} A structural metadata object
 * @private
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 */
export default function parseStructuralMetadata(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const extension = options.extension;

  // The calling code is responsible for loading the schema.
  // This keeps metadata parsing synchronous.
  const schema = options.schema;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.extension", extension);
  Check.typeOf.object("options.schema", schema);
  //>>includeEnd('debug');

  let i;
  const propertyTables = [];
  if (defined(extension.propertyTables)) {
    for (i = 0; i < extension.propertyTables.length; i++) {
      const propertyTable = extension.propertyTables[i];
      const classDefinition = schema.classes[propertyTable.class];
      const metadataTable = new MetadataTable({
        count: propertyTable.count,
        properties: propertyTable.properties,
        class: classDefinition,
        bufferViews: options.bufferViews,
      });
      propertyTables.push(
        new PropertyTable({
          id: i,
          name: propertyTable.name,
          count: propertyTable.count,
          metadataTable: metadataTable,
          extras: propertyTable.extras,
          extensions: propertyTable.extensions,
        })
      );
    }
  }

  const propertyTextures = [];
  if (defined(extension.propertyTextures)) {
    for (i = 0; i < extension.propertyTextures.length; i++) {
      const propertyTexture = extension.propertyTextures[i];
      propertyTextures.push(
        new PropertyTexture({
          id: i,
          name: propertyTexture.name,
          featureTexture: reformatPropertyTexture(propertyTexture),
          class: schema.classes[propertyTexture.class],
          textures: options.textures,
        })
      );
    }
  }

  return new StructuralMetadata({
    schema: schema,
    propertyTables: propertyTables,
    propertyTextures: propertyTextures,
    statistics: extension.statistics,
    extras: extension.extras,
    extensions: extension.extensions,
  });
}

/**
 * The legacy EXT_feature_metadata schema was a bit broad in what it could do.
 * The properties in a feature texture could potentially belong to different
 * textures. For full backwards compatibility, here we transcode <i>backwards</i>
 * from EXT_structural_metadata to EXT_feature_metadata.
 *
 * @param {Object} propertyTexture The property texture JSON from EXT_structural_metadata
 * @return {Object} The corresponding feature texture JSON for the legacy EXT_feature_metadata
 * @private
 */
function reformatPropertyTexture(propertyTexture) {
  // in EXT_structural_metadata propertyTexture is a valid glTF textureInfo
  // since it has an index and a texCoord.
  const textureInfo = clone(propertyTexture);

  const featureTexture = clone(propertyTexture);
  featureTexture.properties = {};

  const originalProperties = propertyTexture.properties;
  for (const propertyId in originalProperties) {
    if (originalProperties.hasOwnProperty(propertyId)) {
      const channels = originalProperties[propertyId];
      featureTexture.properties[propertyId] = {
        texture: textureInfo,
        channels: reformatChannels(channels),
      };
    }
  }

  return featureTexture;
}

/**
 * Reformat from an array of channel indices like <code>[0, 1]</code> to a
 * string of channels as would be used in GLSL swizzling (e.g. "rg")
 *
 * @param {Number[]} channels the channel indices
 * @return {String} The channels as a string of "r", "g", "b" or "a" characters.
 * @private
 */
function reformatChannels(channels) {
  return channels
    .map(function (channelIndex) {
      return "rgba".charAt(channelIndex);
    })
    .join("");
}
