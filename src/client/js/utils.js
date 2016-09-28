import toastr from 'toastr';

export const errToast = (err) => {
    if (err.body) toastr.error(err.body);
    else toastr.error(err.toString());
};

export const okToast = (ok) => {
    if (ok.body) toastr.success(ok.body);
    else toastr.success(ok.toString());
};
