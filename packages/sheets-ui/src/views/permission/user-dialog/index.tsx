import type { ICollaborator } from '@univerjs/protocol';
import { IAuthzIoService, LocaleService } from '@univerjs/core';
import { Avatar, Button, clsx, Input, scrollbarClassName } from '@univerjs/design';
import { CheckMarkIcon } from '@univerjs/icons';
import { UnitRole } from '@univerjs/protocol';
import { IDialogService, useDependency, useObservable } from '@univerjs/ui';
import { useCallback, useEffect, useState } from 'react';
import { UNIVER_SHEET_PERMISSION_USER_DIALOG_ID } from '../../../consts/permission';
import { SheetPermissionUserManagerService } from '../../../services/permission/sheet-permission-user-list.service';
import { UserEmptyBase64 } from './constant';

export const SheetPermissionUserDialog = () => {
    // const [inputValue, setInputValue] = useState('');
    const [userList, setUserList] = useState<IUser[]>([]);
    const localeService = useDependency(LocaleService);
    const dialogService = useDependency(IDialogService);
    const authzIoService = useDependency(IAuthzIoService);
    const sheetPermissionUserManagerService = useDependency(SheetPermissionUserManagerService);
    const editType = sheetPermissionUserManagerService.authzType;
    // const editorList = useObservable(sheetPermissionUserManagerService.userList$, sheetPermissionUserManagerService.userList);
    // const searchUserList = userList?.filter((item) => {
    //     return item.subject?.name.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase()) && item.role === UnitRole.Editor;
    // }) ?? [];
    const [selectUserInfo, setSelectUserInfo] = useState<ICollaborator[]>(sheetPermissionUserManagerService.selectUserList.map(user => ({
        ...user, show:editType === 'edit' ? user._role?.includes(UnitRole.Editor) : true
    })));

    const handleChangeUser = (item: ICollaborator) => {
        const target = selectUserInfo?.find((v) => v.subject?.userID === item.subject?.userID);
        if (!target) {
            const select: ICollaborator = {
                ...item,
                _role: editType === 'edit' ? [UnitRole.Editor, UnitRole.Reader] : [UnitRole.Reader],
                show: true
            };
            setSelectUserInfo([...selectUserInfo, select]);
        } else {
            if (editType === 'edit' && !item?._role?.includes(UnitRole.Editor)) {
                target._role = [UnitRole.Editor, UnitRole.Reader]
                target.show = true;
                setSelectUserInfo([...selectUserInfo])
            } else {
                const newSelectUserInfo = selectUserInfo.filter((v) => v.subject?.userID !== item.subject?.userID);
                setSelectUserInfo(newSelectUserInfo);
            }
        }
    };

    const handleSearch = useCallback((() => {
      let timer: any = null;
      let lastKey: string = ''
      return (newKey: string) => {
        lastKey = newKey
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(async () => {
          const userList = await authzIoService.getUserList(newKey)
          if (newKey != lastKey) {
            return
          }
          setUserList(userList)
        }, 500);
      };
    })(), []);

    useEffect(() => {
        handleSearch('')
    }, []);

    return (
        <div>
            <div>
                <Input
                    className="univer-w-full"
                    placeholder={localeService.t('permission.dialog.search')}
                    // value={inputValue}
                    onChange={(v) => handleSearch(v)}
                />
            </div>
            <div className={clsx('univer-h-60 univer-overflow-y-auto', scrollbarClassName)}>
                {userList?.length > 0
                    ? userList?.map((item) => {
                        return (
                            <div
                                key={item.subject?.userID}
                                className={`
                                  univer-my-2 univer-flex univer-items-center univer-rounded-md
                                  hover:univer-bg-gray-50
                                `}
                                onClick={() => handleChangeUser(item)}
                            >
                                <Avatar src={item.subject?.avatar} size={24} />
                                <div className="univer-ml-1.5 univer-flex-1">{item.subject?.name}</div>
                                {selectUserInfo?.findIndex((v) => v.subject?.userID === item.subject?.userID && v.show) !== -1 && (<div><CheckMarkIcon /></div>)}
                            </div>
                        );
                    })
                    : (
                        <div className="univer-flex univer-h-full univer-flex-col univer-items-center">
                            <img
                                className="univer-w-full"
                                src={UserEmptyBase64}
                                alt="empty list"
                                draggable={false}
                            />
                            <p className="univer-text-sm univer-text-gray-400">
                                {localeService.t('permission.dialog.userEmpty')}
                            </p>
                        </div>
                    )}
            </div>
            <div className="univer-h-px univer-w-full univer-bg-gray-200" />
            <div className="univer-flex univer-items-center univer-justify-end univer-gap-1 univer-py-2">
                <Button
                    onClick={() => dialogService.close(UNIVER_SHEET_PERMISSION_USER_DIALOG_ID)}
                >
                    {localeService.t('permission.button.cancel')}
                </Button>
                <Button
                    variant="primary"
                    onClick={() => {
                        sheetPermissionUserManagerService.setSelectUserList(selectUserInfo.map(u => {
                            delete u.show;
                            return u;
                        }));
                        dialogService.close(UNIVER_SHEET_PERMISSION_USER_DIALOG_ID);
                    }}
                >
                    {localeService.t('permission.button.confirm')}
                </Button>
            </div>
        </div>
    );
};
