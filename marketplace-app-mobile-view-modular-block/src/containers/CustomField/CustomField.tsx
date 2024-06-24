// Import necessary modules and styles
import "./styles.scss";
import {
  Button,
  Icon,
  Paragraph,
  Select,
  SkeletonTile,
  Tooltip,
} from "@contentstack/venus-components";
import { useEffect, useState } from "react";
import ContentstackAppSdk from "@contentstack/app-sdk";

const CustomFieldExtension = () => {
  // Define the app name
  const appName = "academy";

  // State variables initialization
  const [state, setState] = useState<any>({
    config: {},
    location: {},
    appSdkInitialized: false,
  });
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState<any>({});
  const [selectedModularBlockList, setSelectedModularBlockList] = useState<
    any[]
  >([]);
  const [entryData, setEntryData] = useState<any>({});
  const [syncData, setSyncData] = useState<any>([]);
  const [syncError, setSyncError] = useState("");

  // Effect hook for initializing the app SDK
  useEffect(() => {
    ContentstackAppSdk.init()
      .then(async (appSdk: any) => {
        // Get configuration and entry data
        const config = await appSdk?.getConfig();
        const entryData = appSdk?.location?.CustomField?.entry?.getData();
        const customFieldUid = appSdk?.location?.CustomField?.field?.uid;
        const entryCustomFieldData = entryData[`${customFieldUid}`];
        appSdk?.location?.CustomField?.frame?.enableAutoResizing();

        // Extract schema and set options
        const uid = appSdk?.location?.CustomField?.entry?.content_type?.uid;
        const schema =
          appSdk?.location?.CustomField?.entry?.content_type?.schema;
        let modular_blocks_list = schema
          .filter((field: any) => field.data_type == "blocks")
          .map((field: any) => ({
            display_name: field.display_name,
            uid: field.uid,
            id: field.uid,
            label: field.display_name,
            value: field.uid,
          }));

        setOptions(modular_blocks_list);

        // Handle existing custom field data
        if (entryCustomFieldData?.data?.length) {
          let currentSelectedOption = modular_blocks_list.find(
            (op: any) => op.uid == entryCustomFieldData.referenceUid
          );

          let entryDataModularBlock = entryData[`${currentSelectedOption.id}`];
          let entryDataCustomField = entryCustomFieldData.data;

          entryDataModularBlock = entryDataModularBlock.map(
            (component: any) => {
              const key = Object.keys(component)[0];
              return component[key]._metadata.uid;
            }
          );
          entryDataModularBlock.sort();

          let x = entryDataCustomField.map((item: any) => {
            const key = Object.keys(item)[0];
            return item[key].uid;
          });
          x.sort();

          if (JSON.stringify(entryDataModularBlock) !== JSON.stringify(x)) {
            // Find missing uids and update sync data
            const missingUids = entryDataModularBlock.filter(
              (uid: any) => !x.includes(uid)
            );

            const missingData = missingUids.map((uid: any) => {
              const component = entryData[`${currentSelectedOption.id}`].find(
                (component: any) => {
                  const key = Object.keys(component)[0];
                  return component[key]._metadata.uid === uid;
                }
              );

              const key = Object.keys(component)[0];
              return { [key]: { uid } };
            });
            setSyncData(missingData);
            setSyncError("Please sync.");
          } else {
            console.log("same", currentSelectedOption.id);
          }

          setSelectedOption(currentSelectedOption);
          setSelectedModularBlockList(entryCustomFieldData.data);
        }
        setEntryData(entryData);
        setState({
          config,
          location: appSdk?.location,
          appSdkInitialized: true,
        });
        setLoading(false);
      })
      .catch((error: any) => {
        console.error("appSdk initialization error", error);
      });
  }, []);

  // Effect hook for syncing selected modular blocks
  useEffect(() => {
    const { location } = state;
    if (!state?.appSdkInitialized) return;

    location.CustomField?.field?.setData({
      data: selectedModularBlockList,
      referenceUid: selectedOption?.uid,
      type: `${appName}`,
    });

    setLoading(false);
  }, [selectedModularBlockList]);

  function processObject(obj: any) {
    let firstKeyValue = null;
    let numKeysMinusOne = Object.keys(obj).length - 1;

    if (Object.keys(obj).length < 3) {
      firstKeyValue = obj[Object.keys(obj)[0]];
    }

    return {
      firstKeyValue: firstKeyValue,
      numOfSubFields: numKeysMinusOne,
    };
  }
  // Handler for changing the selected option
  const handleOnChange = (e: any) => {
    setSelectedOption(e);

    const selectedEntryData = state?.location?.CustomField?.entry?._data;
    const dataCustomField = selectedEntryData[`${e.uid}`];
    console.log("dataCustomField", dataCustomField);
    const uidArray = dataCustomField.map((item: any) => {
      const key = Object.keys(item)[0];
      const processedObj = processObject(item[key]);
      console.log(processedObj);
      const uid = item[key]._metadata.uid;
      return {
        [key]: {
          uid: uid,
          subText: processedObj.firstKeyValue,
          numberOfSubFields: processedObj.numOfSubFields,
          hidden: false,
        },
      };
    });
    //setSelectedReferenceData(dataCustomField);
    setSelectedModularBlockList(uidArray);
  };

  // Move modular block up in the list
  const moveUp = (index: any) => {
    if (index === 0) return;
    const newItems = [...selectedModularBlockList];
    [newItems[index - 1], newItems[index]] = [
      newItems[index],
      newItems[index - 1],
    ];
    setSelectedModularBlockList(newItems);
  };

  // Move modular block down in the list
  const moveDown = (index: any) => {
    if (index === selectedModularBlockList.length - 1) return;
    const newItems = [...selectedModularBlockList];
    [newItems[index + 1], newItems[index]] = [
      newItems[index],
      newItems[index + 1],
    ];
    setSelectedModularBlockList(newItems);
  };

  // Handle syncing of modular blocks
  const handleSync = () => {
    if (syncData.length > 0) {
      setSelectedModularBlockList([...selectedModularBlockList, syncData[0]]);
      setSyncError("");
      setSyncData([]);
    }
  };

  const toggleVisibility = (index: any) => {
    const newSelectedModularBlockList = [...selectedModularBlockList];
    const keys = Object.keys(newSelectedModularBlockList[index]);
    newSelectedModularBlockList[index][keys[0]].hidden =
      !newSelectedModularBlockList[index][keys[0]].hidden;
    setSelectedModularBlockList(newSelectedModularBlockList);
  };
  // Render the custom field UI
  const renderCustomField = () => {
    if (loading) {
      return (
        <SkeletonTile
          numberOfTiles={2}
          tileHeight={10}
          tileWidth={300}
          tileBottomSpace={20}
          tileTopSpace={10}
          tileleftSpace={10}
          tileRadius={10}
          data-testid="loading"
        />
      );
    }
    if (selectedModularBlockList?.length) {
      return selectedModularBlockList.map((item, index) => {
        console.log(item);
        const keys = Object.keys(item);
        const subText = item[keys[0]].subText;
        const numOfSubFields = item[keys[0]].numberOfSubFields;
        const isHidden = item[keys[0]].hidden;
        return (
          <div className="modular-block-mobile">
            <div className="block-title">
              <Icon icon="ModularBlocks" size="small" />
              <Paragraph
                text={keys[0] + (subText ? `(${subText})` : '')}
                variant="p2"
                variantStyle="bold"
              />
              <div className="numOfField">{numOfSubFields}</div>
            </div>
            <div className="reorder-buttons">
              {index !== 0 && (
                <Icon
                  hover
                  hoverType="secondary"
                  icon="ArrowUp"
                  shadow="medium"
                  onClick={() => {
                    moveUp(index);
                  }}
                />
              )}
              {index !== selectedModularBlockList.length - 1 && (
                <Icon
                  hover
                  hoverType="secondary"
                  icon="ArrowDown"
                  shadow="medium"
                  onClick={() => {
                    moveDown(index);
                  }}
                />
              )}
              <Button
                buttonType="tertiary"
                hover
                onClick={() => {
                  toggleVisibility(index);
                }}
              >
                {isHidden ? "Unhide" : "Hide"}
              </Button>
            </div>
          </div>
        );
      });
    }

    return (
      <div className="no-selected-items" data-test-id="noItem">
        No Products Added
      </div>
    );
  };

  // Return the UI
  return (
    <div className="layout-container">
      {state?.appSdkInitialized && (
        <div className="field-extension-wrapper" data-test-id="field-wrapper">
          <div className="mobile-view-custom-field">
            <div className="mobile-view-custom-field-header">
              <Select
                value={selectedOption}
                options={options}
                onChange={handleOnChange}
              />
              <Tooltip
                content="Sync"
                position="bottom"
                type="primary"
                variantType="dark"
              >
                <Icon
                  hover
                  hoverType="secondary"
                  icon="RetryGray"
                  shadow="medium"
                  onClick={() => {
                    handleSync();
                  }}
                />
              </Tooltip>
              {syncError}
            </div>
            <div className="custom-field-body"></div>
            {renderCustomField()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFieldExtension;
